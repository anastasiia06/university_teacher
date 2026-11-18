(function () {
    const MAX_PREVIEW = 120;

    const CMD_NEXT = "далі";
    const CMD_BACK = "назад";
    const CMD_EXIT = "вихід";

    const ALIASES = { "д": CMD_NEXT, "н": CMD_BACK, "в": CMD_EXIT };

    const NODE_TYPES = {
        [Node.ELEMENT_NODE]: "Елемент",
        [Node.TEXT_NODE]: "Текст",
        [Node.COMMENT_NODE]: "Коментар",
        [Node.DOCUMENT_TYPE_NODE]: "Doctype"
    };


    function collectNodes(node, list) {
        if (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim()) {
            return list;
        }
        list.push(node);
        for (let child = node.firstChild; child; child = child.nextSibling) {
            collectNodes(child, list);
        }
        return list;
    }

    function shorten(text) {
        const clean = text.replace(/\s+/g, " ").trim();
        return clean.length > MAX_PREVIEW ? clean.slice(0, MAX_PREVIEW) + "…" : clean;
    }

    function describeNode(node) {
        const type = NODE_TYPES[node.nodeType] || "Вузол";
        let name = node.nodeName;
        let content = "";

        if (node.nodeType === Node.ELEMENT_NODE) {
            const id = node.id ? "#" + node.id : "";
            const cls = node.classList.length ? "." + Array.from(node.classList).join(".") : "";
            name = "<" + node.tagName.toLowerCase() + id + cls + ">";
            content = shorten(node.textContent);
        } else {
            content = shorten(node.nodeValue || "");
        }

        return { type, name, content: content || "(порожньо)" };
    }


    function ask(message, defaultAnswer, callback) {
        const raw = prompt(message, defaultAnswer);
        if (raw === null) {
            callback(null);
            return;
        }
        const answer = raw.trim().toLowerCase();
        callback(ALIASES[answer] || answer);
    }

    function buildMessage(nodes, index, allowed) {
        const info = describeNode(nodes[index]);
        const position = index === nodes.length - 1
            ? `Нижній вузол ${index + 1} із ${nodes.length}`
            : `Вузол ${index + 1} із ${nodes.length}`;

        let question;
        if (index === 0) {
            question = 'Перейти до наступного вузла ("далі") чи завершити роботу ("вихід")?';
        } else if (index === nodes.length - 1) {
            question = 'Повернутися назад ("назад") чи вийти ("вихід")?';
        } else {
            question = 'Пройти далі ("далі") чи повернутися ("назад")?';
        }

        return (
            `${position}\n` +
            `Тип: ${info.type}\n` +
            `Назва: ${info.name}\n` +
            `Вміст: ${info.content}\n\n` +
            `${question}\n` +
            `(Скорочення: д / н / в. «Вихід» завершує роботу.)`
        );
    }



    function showNode(nodes, index, handlers) {
        const last = nodes.length - 1;

        let allowed;
        if (index === 0) {
            allowed = [CMD_NEXT, CMD_EXIT];
        } else if (index === last) {
            allowed = [CMD_BACK, CMD_EXIT];
        } else {
            allowed = [CMD_NEXT, CMD_BACK];
        }

        ask(buildMessage(nodes, index, allowed), allowed[0], function (answer) {
            if (answer === null || answer === CMD_EXIT) {
                handlers.onExit();
            } else if (answer === CMD_NEXT && allowed.includes(CMD_NEXT)) {
                handlers.onNext(index);
            } else if (answer === CMD_BACK && allowed.includes(CMD_BACK)) {
                handlers.onBack(index);
            } else {
                alert("Невірна команда. Введіть одну з: " + allowed.join(", ") + ".");
                handlers.onRetry(index);
            }
        });
    }



    function startNavigator(onFinish) {
        const nodes = collectNodes(document.documentElement, []);


        function step(index) {
            setTimeout(function () {
                showNode(nodes, index, handlers);
            }, 0);
        }

        const handlers = {
            onNext: function (i) { step(i + 1); },
            onBack: function (i) { step(i - 1); },
            onRetry: function (i) { step(i); },
            onExit: function () {
                alert("Роботу завершено.");
                onFinish();
            }
        };

        step(0);
    }

    window.addEventListener("DOMContentLoaded", function () {
        const button = document.getElementById("dom-nav-btn");
        if (!button) return;

        button.addEventListener("click", function () {
            button.disabled = true;
            startNavigator(function () {
                button.disabled = false;
            });
        });
    });
})();
