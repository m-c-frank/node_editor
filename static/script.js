document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/nodes/random');
    const node = await response.json();
    const nodeDiv = displayNode(node);
    setupFormSubmission();
});


function displayNode(node) {
    const div = document.getElementById('nodeViewer');

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

    // id must be read only
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


function setupFormSubmission() {
    document.getElementById('submitNode').onclick = async () => {
        const new_id = generateUUID();
        const new_name = document.getElementById('nodeName').value;
        const new_timestamp = document.getElementById('nodeTimestamp').value;
        const new_origin = document.getElementById('nodeOrigin').value;
        const new_text = document.getElementById('nodeText').value;

        const original_id = document.getElementById('nodeID').value;

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
            //reload the site
            location.reload();
        } else {
            // Handle errors or unsuccessful submission
            alert('Failed to submit annotation.');
        }
    };
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
