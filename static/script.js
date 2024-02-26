document.addEventListener("DOMContentLoaded", () => {
    function seedSubmitCallback() {
        document.getElementById('seedSubmit').addEventListener('click', async () => {
        });
    }

    const similarRequest = {
        "id": generateUUID(),
        "name": "similarity_seed_" + String(Date.now()),
        "timestamp": String(Date.now()),
        "origin": "node_editor:seeding/static/",
        "text": "",
        "type": "node"
    };

    const nodeDiv = displayNode(similarRequest);
    document.getElementById('nodeContainer').appendChild(nodeDiv);
    setupNodeSubmission(nodeDiv, "search");
});


function displayNode(node) {
    const div = document.createElement('div');
    div.classList.add('nodeViewer');

    const id = document.createElement('textarea');
    const name = document.createElement('textarea');
    const timestamp = document.createElement('textarea');
    const origin = document.createElement('textarea');
    const new_origin = document.createElement('textarea');
    const text = document.createElement('textarea');

    text.classList.add('nodeText');

    const id_span = document.createElement('span');
    const name_span = document.createElement('span');
    const timestamp_span = document.createElement('span');
    const origin_span = document.createElement('span');
    const new_origin_span = document.createElement('span');
    const text_span = document.createElement('span');

    id.id = 'nodeID';
    name.id = 'nodeName';
    timestamp.id = 'nodeTimestamp';
    origin.id = 'nodeOrigin';
    new_origin.id = 'newNodeOrigin';
    text.id = 'nodeText';

    id.textContent = node.id;
    name.textContent = node.name;
    timestamp.textContent = Date.now();
    origin.textContent = node.origin;
    new_origin.textContent = "manual node editor";
    text.textContent = node.text;

    id_span.textContent = 'Source ID: ';
    name_span.textContent = 'Name: ';
    timestamp_span.textContent = 'Timestamp: ';
    origin_span.textContent = 'Source origin: ';
    new_origin_span.textContent = 'New origin: ';
    text_span.textContent = 'Text: ';

    id.disabled = true;
    origin.disabled = true;
    timestamp.disabled = true;

    div.appendChild(id_span);
    div.appendChild(id);
    div.appendChild(name_span);
    div.appendChild(name);
    div.appendChild(timestamp_span);
    div.appendChild(timestamp);
    div.appendChild(origin_span);
    div.appendChild(origin);
    div.appendChild(new_origin_span);
    div.appendChild(new_origin);
    div.appendChild(text_span);
    div.appendChild(text);

    return div
}


function newNode(nodeViewerDiv) {
    const new_id = generateUUID();
    const new_name = nodeViewerDiv.querySelector('#nodeName').value;
    const new_timestamp = nodeViewerDiv.querySelector('#nodeTimestamp').value;
    const new_origin = nodeViewerDiv.querySelector('#nodeOrigin').value;
    const new_text = nodeViewerDiv.querySelector("#nodeText").value;

    const new_node = {
        id: new_id,
        name: new_name,
        timestamp: new_timestamp,
        origin: new_origin,
        text: new_text,
    };

    return new_node;
}


function setupNodeSubmission(nodeViewerDiv, mode) {
    const submitButton = document.createElement('button');

    const original_id = nodeViewerDiv.querySelector('#nodeID').value;

    submitButton.id = 'submitNode';
    submitButton.textContent = 'Submit';

    nodeViewerDiv.appendChild(submitButton);

    submitButton.onclick = async () => {
        const main_node = newNode(nodeViewerDiv);
        if (mode == "insert") {

            const link = {
                source: original_id,
                target: new_id,
            };

            const response = await fetch('/graph/insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nodes: [main_node],
                    links: [link],
                }),
            });

            if (response.ok) {
                location.reload();
            } else {
                console.error('Failed to submit new node:', response);
            }
        }
        else if (mode == "search"){
            try {
                const response = await fetch('/nodes/similar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(main_node),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch similar nodes.');
                }

                const similarNodesJson = await response.json();

                if (similarNodesJson && similarNodesJson.length > 0) {
                    const similar1div = displayNode(similarNodesJson[0]);
                    document.getElementById('similarContainer1').appendChild(similar1div);
                    setupNodeSubmission(similar1div, "search");

                    const similar2div = displayNode(similarNodesJson[1]);
                    document.getElementById('similarContainer2').appendChild(similar2div);
                    setupNodeSubmission(similar2div, "search");
                } else {
                    alert('No similar nodes found.');
                }
            } catch (error) {
                alert('Failed to fetch similar nodes.');
            }
        }
    };
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
