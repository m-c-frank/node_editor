document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('seedSubmit').addEventListener('click', async () => {
        const seed = document.getElementById('seedInput').value;

        const similarRequest = {
            "id": generateUUID(),
            "name": String(Date.now()),
            "timestamp": String(Date.now()),
            "origin": "manual node editor",
            "text": seed,
            "type": "node"
        };

        try {
            const response = await fetch('/nodes/similar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(similarRequest),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch similar nodes.');
            }

            const similarNodesJson = await response.json();
            console.log(similarNodesJson);

            if (similarNodesJson && similarNodesJson.length >  0) {
                const nodeDiv = displayNode(similarNodesJson[0]);
                document.getElementById('nodeContainer').appendChild(nodeDiv);
                const similar1div = displayNode(similarNodesJson[1]);
                document.getElementById('similarContainer1').appendChild(similar1div);
                const similar2div = displayNode(similarNodesJson[2]);
                document.getElementById('similarContainer2').appendChild(similar2div);
            } else {
                alert('No similar nodes found.');
            }
        } catch (error) {
            console.error('Error fetching similar nodes:', error);
            alert('Failed to fetch similar nodes.');
        }
    });
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

    setupNodeSubmission(div);

    return div
}


function setupNodeSubmission(nodeViewerDiv) {
    const submitButton = document.createElement('button');
    submitButton.id = 'submitNode';
    submitButton.textContent = 'Submit';
    nodeViewerDiv.appendChild(submitButton);
    submitButton.onclick = async () => {
        const new_id = generateUUID();
        const new_name = nodeViewerDiv.querySelector('#nodeName').value;
        console.log(new_name);
        const new_timestamp = nodeViewerDiv.querySelector('#nodeTimestamp').value;
        const new_origin = nodeViewerDiv.querySelector('#nodeOrigin').value;
        const new_text = nodeViewerDiv.querySelector("#nodeText").value;

        const original_id = nodeViewerDiv.querySelector('#nodeID').value;

        const new_node = {
            id: new_id,
            name: new_name,
            timestamp: new_timestamp,
            origin: new_origin,
            text: new_text,
        };

        const link = {
            source: original_id,
            target: new_id,
        };

        console.log(new_node);
        console.log(link);

        const response = await fetch('/graph/insert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nodes: [new_node],
                links: [link],
            }),
        });

        if (response.ok) {
            location.reload();
        } else {
            alert('Failed to submit annotation.');
        }
    };
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
