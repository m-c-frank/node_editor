import fastapi
import numpy as np
import random
import requests
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import networkx as nx
from networkx.readwrite import json_graph
import json
import time

app = fastapi.FastAPI()

session_graph = nx.Graph()

NODES_URL = "http://localhost:5020/nodes"
EMBEDDINGS_URL = "http://localhost:5020/embeddings"
EMBED_URL = "http://localhost:5020/embed/text"
HOST = "localhost"
PORT = 5030
PATH_SESSION_GRAPHS = "/home/mcfrank/brain/data/node_editor_subgraphs"

session_timestamp = str(int(time.time()*1000))
SESSION_GRAPH_FILE = f"session_graph_{session_timestamp}.json"


class Embedding(BaseModel):
    node_id: str
    embedding: List[float]


class Link(BaseModel):
    source: str
    target: str


class Node(BaseModel):
    type: str = "node"
    id: str
    name: str
    timestamp: int
    origin: str
    text: str


# reccursively get all files in a directory except .files and .directories
def get_nodes():
    # nodes are a list at localhost:5020/nodes
    temp_nodes = []
    request = requests.get(NODES_URL)
    if request.status_code == 200:
        temp_nodes_json = request.json()
        temp_node_dicts = [dict(node) for node in temp_nodes_json]
        for temp_node_dict in temp_node_dicts:
            temp_node = Node(
                id=temp_node_dict["id"],
                name=temp_node_dict["name"],
                timestamp=temp_node_dict["timestamp"],
                origin=temp_node_dict["origin"],
                text=temp_node_dict["text"]
            )
            temp_nodes.append(temp_node)

    return temp_nodes


def get_embeddings():
    # embeddings are a list at localhost:5020/embeddings
    temp_embeddings = []
    request = requests.get(EMBEDDINGS_URL)

    if request.status_code == 200:
        temp_embeddings_json = request.json()
        temp_embedding_dicts = [dict(embedding)
                                for embedding in temp_embeddings_json]
        for temp_embedding_dict in temp_embedding_dicts:
            temp_embedding = Embedding(
                node_id=temp_embedding_dict["node_id"],
                embedding=temp_embedding_dict["embedding"]
            )
            temp_embeddings.append(temp_embedding)

    return temp_embeddings


class EmbeddingVector(List[float]):
    pass


def embed(text: str) -> List[float]:
    request = requests.post(EMBED_URL, json={"text": text})
    if request.status_code == 200:
        return request.json()


nodes = get_nodes()
embeddings = get_embeddings()
print(len(nodes))
print(len(embeddings))

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return fastapi.responses.FileResponse("index.html")


@app.get("/nodes/random")
def get_random() -> Node:
    r_node = random.choice(nodes)
    return r_node


class SimilarNodesRequest(Node):
    pass


def get_node_embedding(node_id: str):
    node_ids = [embedding.node_id for embedding in embeddings]

    if node_id not in node_ids:
        return None

    for embedding in embeddings:
        if embedding.node_id == node_id:
            return embedding.embedding


@app.post("/nodes/similar")
def get_similar(similar_nodes_request: SimilarNodesRequest) -> List[Node]:
    base_node_id = similar_nodes_request.id

    node_embedding = embed(similar_nodes_request.text)

    node_id_similarity_map = {}
    for embedding_obj in embeddings:
        if embedding_obj.node_id == base_node_id:
            continue
        temp_id = embedding_obj.node_id
        embedding_vector = embedding_obj.embedding
        temp_embedding = np.array(embedding_vector)
        similarity = (
            np.dot(temp_embedding, node_embedding)
        ) / (
            np.linalg.norm(node_embedding) * np.linalg.norm(temp_embedding)
        )
        node_id_similarity_map[temp_id] = similarity

    # Sort by similarity score and select top N
    zipped_map = list(node_id_similarity_map.items())
    zipped_map.sort(key=lambda x: x[1], reverse=True)
    top_similar_nodes = zipped_map[:8]

    samples = random.sample(top_similar_nodes, 2)

    sampled_nodes = []
    for sample in samples:
        id = sample[0]
        for node in nodes:
            if node.id == id:
                sampled_nodes.append(node)

    return sampled_nodes


class NodeInsertRequest(BaseModel):
    nodes: List[Node]
    links: List[Link]


@app.post("/graph/insert")
def insert_into_graph(node_insert_request: NodeInsertRequest):
    print(node_insert_request.nodes)
    print(node_insert_request.links)
    for node in node_insert_request.nodes:
        session_graph.add_node(
            node.id,
            name=node.name,
            timestamp=node.timestamp,
            origin=node.origin,
            text=node.text
        )
    for link in node_insert_request.links:
        session_graph.add_edge(link.source, link.target)

    subgraph_json = json_graph.node_link_data(session_graph)

    # persist the graph to disk
    with open(f"{PATH_SESSION_GRAPHS}/{SESSION_GRAPH_FILE}", "w") as f:
        json.dump(subgraph_json, f)

    return {"status": "ok"}


if __name__ == "__main__":
    # get all files in the current directory
    # start the server
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
