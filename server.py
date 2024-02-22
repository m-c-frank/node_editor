import fastapi
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
HOST = "localhost"
PORT = 5030
PATH_SESSION_GRAPHS = "/home/mcfrank/brain/data/node_editor_subgraphs"

session_timestamp = str(int(time.time()*1000))
SESSION_GRAPH_FILE = f"session_graph_{session_timestamp}.json"


class Link(BaseModel):
    source: str
    target: str


class Node(BaseModel):
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
        temp_nodes = request.json()
    return temp_nodes


nodes = get_nodes()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return fastapi.responses.FileResponse("index.html")


@app.get("/nodes/random")
def get_random() -> Node:
    return random.choice(nodes)


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
