﻿window.App = window.App || {};

(function () {
    var editor;

    window.App.initRepl = function (editorContainerId, resultContainerId, editorId) {
        setElementHeight(editorContainerId);
        setElementHeight(resultContainerId);

        initReplSplitter(editorContainerId, resultContainerId, editorId);

        window.addEventListener('resize', () => {
            setElementHeight(resultContainerId);
            setElementHeight(editorContainerId);
            resetEditor(editorId);
        });
    }

    window.App.reloadIFrame = function (id) {
        const iFrame = document.getElementById(id);
        if (iFrame) {
            iFrame.contentWindow.location.reload();
        }
    }

    window.App.initEditor = function (editorId, defaultValue) {
        var value = defaultValue ||
            `<h1>Hello World</h1>

@code {

}
`;

        require.config({ paths: { 'vs': 'lib/monaco-editor/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            editor = monaco.editor.create(document.getElementById(editorId), {
                fontSize: '16px',
                value: value,
                language: 'razor'
            });
        });
    }

    window.App.getEditorValue = function () {
        return editor && editor.getValue();
    }

    window.App.readFile = function (file) {
        var response = new Response(new Blob([base64ToArrayBuffer(file)], { type: 'application/octet-stream' }));

        caches.open('blazor-resources-/').then(function (cache) {
            if (!cache) {
                // TODO: alert user
                return;
            }

            cache.keys().then(function (keys) {
                const keysForDelete = keys.filter(x => x.url.indexOf('UserComponents') > -1);

                var dll = keysForDelete.find(x => x.url.indexOf('dll') > -1).url.substr(window.location.origin.length);
                cache.delete(dll).then(function () {
                    cache.put(dll, response).then(function () { });
                });
            });
        });

        function base64ToArrayBuffer(base64) {
            const binaryString = window.atob(base64);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                const ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }

            return bytes;
        }
    }

    function initReplSplitter(editorContainerId, resultContainerId, editorId) {
        if (editorContainerId &&
            resultContainerId &&
            document.getElementById(editorContainerId) &&
            document.getElementById(resultContainerId)) {

            var lastTime = 0;
            Split(['#' + editorContainerId, '#' + resultContainerId], {
                elementStyle: (dimension, size, gutterSize) => ({
                    'flex-basis': `calc(${size}% - ${gutterSize}px)`,
                }),
                gutterStyle: (dimension, gutterSize) => ({
                    'flex-basis': `${gutterSize}px`,
                }),
                onDrag: () => throttle(() => resetEditor(editorId), 100),
                onDragEnd: () => resetEditor(editorId)
            });

            function throttle(func, timeFrame) {
                const now = new Date();
                if (now - lastTime >= timeFrame) {
                    func();
                    lastTime = now;
                }
            }
        }
    };

    function resetEditor(editorId) {
        const value = window.App.getEditorValue();
        const oldEditorElement = document.getElementById(editorId);
        if (oldEditorElement && oldEditorElement.childNodes) {
            oldEditorElement.childNodes.forEach(c => oldEditorElement.removeChild(c));
        }

        window.App.initEditor(editorId, value);
    }

    function setElementHeight(elementId) {
        const element = document.getElementById(elementId);
        // TODO: Abstract class name
        const height = window.innerHeight - document.getElementsByClassName('repl-navbar')[0].offsetHeight;

        element.style.height = height + 'px';
    }
}());
