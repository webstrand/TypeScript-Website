var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gistPoweredNavBar = void 0;
    const gistPoweredNavBar = (sandbox, ui, showNav) => {
        const gistHash = location.hash.split("#gist/")[1];
        const [gistID, gistStoryIndex] = gistHash.split("-");
        // @ts-ignore
        window.appInsights && window.appInsights.trackEvent({ name: "Loaded Gist Playground", properties: { id: gistID } });
        sandbox.editor.updateOptions({ readOnly: true });
        ui.flashInfo(`Opening Gist ${gistID} as a Docset`, 2000);
        const playground = document.getElementById("playground-container");
        playground.style.opacity = "0.5";
        const setCode = (code) => {
            const story = document.getElementById("story-container");
            if (story)
                story.style.display = "none";
            const toolbar = document.getElementById("editor-toolbar");
            if (toolbar)
                toolbar.style.display = "block";
            const monaco = document.getElementById("monaco-editor-embed");
            if (monaco)
                monaco.style.display = "block";
            sandbox.setText(code);
            sandbox.editor.layout();
        };
        const setStory = (html) => {
            const toolbar = document.getElementById("editor-toolbar");
            if (toolbar)
                toolbar.style.display = "none";
            const monaco = document.getElementById("monaco-editor-embed");
            if (monaco)
                monaco.style.display = "none";
            const story = document.getElementById("story-container");
            if (!story)
                return;
            story.style.display = "block";
            story.innerHTML = html;
            // We need to hijack internal links
            for (const a of Array.from(story.getElementsByTagName("a"))) {
                if (!a.pathname.startsWith("/play"))
                    continue;
                // Note the the header generated links also count in here
                // overwrite playground links
                if (a.hash.includes("#code/")) {
                    a.onclick = e => {
                        const code = a.hash.replace("#code/", "").trim();
                        let userCode = sandbox.lzstring.decompressFromEncodedURIComponent(code);
                        // Fallback incase there is an extra level of decoding:
                        // https://gitter.im/Microsoft/TypeScript?at=5dc478ab9c39821509ff189a
                        if (!userCode)
                            userCode = sandbox.lzstring.decompressFromEncodedURIComponent(decodeURIComponent(code));
                        if (userCode)
                            setCode(userCode);
                        e.preventDefault();
                        const alreadySelected = document.getElementById("navigation-container").querySelector("li.selected");
                        if (alreadySelected)
                            alreadySelected.classList.remove("selected");
                        return false;
                    };
                }
                // overwrite gist links
                else if (a.hash.includes("#gist/")) {
                    a.onclick = e => {
                        const index = Number(a.hash.split("-")[1]);
                        const nav = document.getElementById("navigation-container");
                        if (!nav)
                            return;
                        const ul = nav.getElementsByTagName("ul").item(0);
                        const targetedLi = ul.children.item(Number(index) || 0) || ul.children.item(0);
                        if (targetedLi) {
                            const a = targetedLi.getElementsByTagName("a").item(0);
                            // @ts-ignore
                            if (a)
                                a.click();
                        }
                        e.preventDefault();
                        return false;
                    };
                }
                else {
                    a.setAttribute("target", "_blank");
                }
            }
        };
        // const relay = "http://localhost:7071/api/API"
        const relay = "https://typescriptplaygroundgistproxyapi.azurewebsites.net/api/API";
        fetch(`${relay}?gistID=${gistID}`)
            .then((res) => __awaiter(void 0, void 0, void 0, function* () {
            playground.style.opacity = "1";
            sandbox.editor.updateOptions({ readOnly: false });
            const response = yield res.json();
            if ("error" in response) {
                return ui.flashInfo(`Error with getting your gist: ${response.display}.`, 3000);
            }
            // If the API response is a single code file, just throw that in
            if (response.type === "code") {
                sandbox.setText(response.code);
                sandbox.setCompilerSettings(response.params);
                // If it's multi-file, then there's work to do
            }
            else if (response.type === "story") {
                showNav();
                const nav = document.getElementById("navigation-container");
                if (!nav)
                    return;
                const title = document.createElement("h4");
                title.textContent = response.title;
                nav.appendChild(title);
                // Make all the sidebar elements
                const ul = document.createElement("ul");
                response.files.forEach((element, i) => {
                    const li = document.createElement("li");
                    switch (element.type) {
                        case "html":
                        case "code": {
                            li.classList.add("selectable");
                            const a = document.createElement("a");
                            let logo;
                            if (element.type === "code") {
                                logo = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="7" fill="#187ABF"/></svg>`;
                            }
                            else if (element.type === "html") {
                                logo = `<svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.5V3.25L6 1H4M8 5.5V10H1V1H4M8 5.5H4V1" stroke="#C4C4C4"/></svg>`;
                            }
                            else {
                                logo = "";
                            }
                            a.innerHTML = `${logo}${element.title}`;
                            a.href = `/play?#gist/${gistID}-${i}`;
                            a.onclick = e => {
                                e.preventDefault();
                                const ed = sandbox.editor.getDomNode();
                                if (!ed)
                                    return;
                                sandbox.editor.updateOptions({ readOnly: false });
                                const alreadySelected = ul.querySelector(".selected");
                                if (alreadySelected)
                                    alreadySelected.classList.remove("selected");
                                li.classList.add("selected");
                                if (element.type === "code") {
                                    setCode(element.code);
                                }
                                else if (element.type === "html") {
                                    setStory(element.html);
                                }
                                const alwaysUpdateURL = !localStorage.getItem("disable-save-on-type");
                                if (alwaysUpdateURL) {
                                    location.hash = `#gist/${gistID}-${i}`;
                                }
                                return false;
                            };
                            li.appendChild(a);
                            break;
                        }
                        case "hr": {
                            const hr = document.createElement("hr");
                            li.appendChild(hr);
                        }
                    }
                    ul.appendChild(li);
                });
                nav.appendChild(ul);
                const targetedLi = ul.children.item(Number(gistStoryIndex) || 0) || ul.children.item(0);
                if (targetedLi) {
                    const a = targetedLi.getElementsByTagName("a").item(0);
                    // @ts-ignore
                    if (a)
                        a.click();
                }
            }
        }))
            .catch(() => {
            ui.flashInfo("Could not reach the gist to playground API, are you (or it) offline?");
            playground.style.opacity = "1";
            sandbox.editor.updateOptions({ readOnly: false });
        });
    };
    exports.gistPoweredNavBar = gistPoweredNavBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL25hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQVFPLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUFnQixFQUFFLEVBQU0sRUFBRSxPQUFtQixFQUFFLEVBQUU7UUFDakYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakQsTUFBTSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRXBELGFBQWE7UUFDYixNQUFNLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFbkgsT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUNoRCxFQUFFLENBQUMsU0FBUyxDQUFDLGdCQUFnQixNQUFNLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUV4RCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFFLENBQUE7UUFDbkUsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFBO1FBRWhDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDL0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1lBQ3hELElBQUksS0FBSztnQkFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFN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QUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUN0RCxhQUFhO29CQUNiLElBQUksQ0FBQzt3QkFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUE7aUJBQ2pCO2FBQ0Y7UUFDSCxDQUFDLENBQUEsQ0FBQzthQUNELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixFQUFFLENBQUMsU0FBUyxDQUFDLHNFQUFzRSxDQUFDLENBQUE7WUFDcEYsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFBO1lBQzlCLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDbkQsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUE7SUF2TFksUUFBQSxpQkFBaUIscUJBdUw3QiIsInNvdXJjZXNDb250ZW50IjpbInR5cGUgU3RvcnlDb250ZW50ID1cbiAgfCB7IHR5cGU6IFwiaHRtbFwiOyBodG1sOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJjb2RlXCI7IGNvZGU6IHN0cmluZzsgcGFyYW1zOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJoclwiIH1cblxuaW1wb3J0IHR5cGUgeyBTYW5kYm94IH0gZnJvbSBcInR5cGVzY3JpcHRsYW5nLW9yZy9zdGF0aWMvanMvc2FuZGJveFwiXG5pbXBvcnQgdHlwZSB7IFVJIH0gZnJvbSBcIi4vY3JlYXRlVUlcIlxuXG5leHBvcnQgY29uc3QgZ2lzdFBvd2VyZWROYXZCYXIgPSAoc2FuZGJveDogU2FuZGJveCwgdWk6IFVJLCBzaG93TmF2OiAoKSA9PiB2b2lkKSA9PiB7XG4gIGNvbnN0IGdpc3RIYXNoID0gbG9jYXRpb24uaGFzaC5zcGxpdChcIiNnaXN0L1wiKVsxXVxuICBjb25zdCBbZ2lzdElELCBnaXN0U3RvcnlJbmRleF0gPSBnaXN0SGFzaC5zcGxpdChcIi1cIilcblxuICAvLyBAdHMtaWdub3JlXG4gIHdpbmRvdy5hcHBJbnNpZ2h0cyAmJiB3aW5kb3cuYXBwSW5zaWdodHMudHJhY2tFdmVudCh7IG5hbWU6IFwiTG9hZGVkIEdpc3QgUGxheWdyb3VuZFwiLCBwcm9wZXJ0aWVzOiB7IGlkOiBnaXN0SUQgfSB9KVxuXG4gIHNhbmRib3guZWRpdG9yLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogdHJ1ZSB9KVxuICB1aS5mbGFzaEluZm8oYE9wZW5pbmcgR2lzdCAke2dpc3RJRH0gYXMgYSBEb2NzZXRgLCAyMDAwKVxuXG4gIGNvbnN0IHBsYXlncm91bmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXlncm91bmQtY29udGFpbmVyXCIpIVxuICBwbGF5Z3JvdW5kLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiXG5cbiAgY29uc3Qgc2V0Q29kZSA9IChjb2RlOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBzdG9yeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RvcnktY29udGFpbmVyXCIpXG4gICAgaWYgKHN0b3J5KSBzdG9yeS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICAgIGNvbnN0IHRvb2xiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRvci10b29sYmFyXCIpXG4gICAgaWYgKHRvb2xiYXIpIHRvb2xiYXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuXG4gICAgY29uc3QgbW9uYWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb25hY28tZWRpdG9yLWVtYmVkXCIpXG4gICAgaWYgKG1vbmFjbykgbW9uYWNvLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcblxuICAgIHNhbmRib3guc2V0VGV4dChjb2RlKVxuICAgIHNhbmRib3guZWRpdG9yLmxheW91dCgpXG4gIH1cblxuICBjb25zdCBzZXRTdG9yeSA9IChodG1sOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItdG9vbGJhclwiKVxuICAgIGlmICh0b29sYmFyKSB0b29sYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXG4gICAgY29uc3QgbW9uYWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb25hY28tZWRpdG9yLWVtYmVkXCIpXG4gICAgaWYgKG1vbmFjbykgbW9uYWNvLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXG4gICAgY29uc3Qgc3RvcnkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0b3J5LWNvbnRhaW5lclwiKVxuICAgIGlmICghc3RvcnkpIHJldHVyblxuXG4gICAgc3Rvcnkuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgIHN0b3J5LmlubmVySFRNTCA9IGh0bWxcbiAgICAvLyBXZSBuZWVkIHRvIGhpamFjayBpbnRlcm5hbCBsaW5rc1xuICAgIGZvciAoY29uc3QgYSBvZiBBcnJheS5mcm9tKHN0b3J5LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYVwiKSkpIHtcbiAgICAgIGlmICghYS5wYXRobmFtZS5zdGFydHNXaXRoKFwiL3BsYXlcIikpIGNvbnRpbnVlXG4gICAgICAvLyBOb3RlIHRoZSB0aGUgaGVhZGVyIGdlbmVyYXRlZCBsaW5rcyBhbHNvIGNvdW50IGluIGhlcmVcblxuICAgICAgLy8gb3ZlcndyaXRlIHBsYXlncm91bmQgbGlua3NcbiAgICAgIGlmIChhLmhhc2guaW5jbHVkZXMoXCIjY29kZS9cIikpIHtcbiAgICAgICAgYS5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgICAgY29uc3QgY29kZSA9IGEuaGFzaC5yZXBsYWNlKFwiI2NvZGUvXCIsIFwiXCIpLnRyaW0oKVxuICAgICAgICAgIGxldCB1c2VyQ29kZSA9IHNhbmRib3gubHpzdHJpbmcuZGVjb21wcmVzc0Zyb21FbmNvZGVkVVJJQ29tcG9uZW50KGNvZGUpXG4gICAgICAgICAgLy8gRmFsbGJhY2sgaW5jYXNlIHRoZXJlIGlzIGFuIGV4dHJhIGxldmVsIG9mIGRlY29kaW5nOlxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0dGVyLmltL01pY3Jvc29mdC9UeXBlU2NyaXB0P2F0PTVkYzQ3OGFiOWMzOTgyMTUwOWZmMTg5YVxuICAgICAgICAgIGlmICghdXNlckNvZGUpIHVzZXJDb2RlID0gc2FuZGJveC5senN0cmluZy5kZWNvbXByZXNzRnJvbUVuY29kZWRVUklDb21wb25lbnQoZGVjb2RlVVJJQ29tcG9uZW50KGNvZGUpKVxuICAgICAgICAgIGlmICh1c2VyQ29kZSkgc2V0Q29kZSh1c2VyQ29kZSlcblxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgICAgY29uc3QgYWxyZWFkeVNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKSEucXVlcnlTZWxlY3RvcihcImxpLnNlbGVjdGVkXCIpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgaWYgKGFscmVhZHlTZWxlY3RlZCkgYWxyZWFkeVNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIG92ZXJ3cml0ZSBnaXN0IGxpbmtzXG4gICAgICBlbHNlIGlmIChhLmhhc2guaW5jbHVkZXMoXCIjZ2lzdC9cIikpIHtcbiAgICAgICAgYS5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSBOdW1iZXIoYS5oYXNoLnNwbGl0KFwiLVwiKVsxXSlcbiAgICAgICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmlnYXRpb24tY29udGFpbmVyXCIpXG4gICAgICAgICAgaWYgKCFuYXYpIHJldHVyblxuICAgICAgICAgIGNvbnN0IHVsID0gbmF2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidWxcIikuaXRlbSgwKSFcblxuICAgICAgICAgIGNvbnN0IHRhcmdldGVkTGkgPSB1bC5jaGlsZHJlbi5pdGVtKE51bWJlcihpbmRleCkgfHwgMCkgfHwgdWwuY2hpbGRyZW4uaXRlbSgwKVxuICAgICAgICAgIGlmICh0YXJnZXRlZExpKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gdGFyZ2V0ZWRMaS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIikuaXRlbSgwKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKGEpIGEuY2xpY2soKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYS5zZXRBdHRyaWJ1dGUoXCJ0YXJnZXRcIiwgXCJfYmxhbmtcIilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBjb25zdCByZWxheSA9IFwiaHR0cDovL2xvY2FsaG9zdDo3MDcxL2FwaS9BUElcIlxuICBjb25zdCByZWxheSA9IFwiaHR0cHM6Ly90eXBlc2NyaXB0cGxheWdyb3VuZGdpc3Rwcm94eWFwaS5henVyZXdlYnNpdGVzLm5ldC9hcGkvQVBJXCJcbiAgZmV0Y2goYCR7cmVsYXl9P2dpc3RJRD0ke2dpc3RJRH1gKVxuICAgIC50aGVuKGFzeW5jIHJlcyA9PiB7XG4gICAgICBwbGF5Z3JvdW5kLnN0eWxlLm9wYWNpdHkgPSBcIjFcIlxuICAgICAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KVxuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcy5qc29uKClcbiAgICAgIGlmIChcImVycm9yXCIgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHVpLmZsYXNoSW5mbyhgRXJyb3Igd2l0aCBnZXR0aW5nIHlvdXIgZ2lzdDogJHtyZXNwb25zZS5kaXNwbGF5fS5gLCAzMDAwKVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgQVBJIHJlc3BvbnNlIGlzIGEgc2luZ2xlIGNvZGUgZmlsZSwganVzdCB0aHJvdyB0aGF0IGluXG4gICAgICBpZiAocmVzcG9uc2UudHlwZSA9PT0gXCJjb2RlXCIpIHtcbiAgICAgICAgc2FuZGJveC5zZXRUZXh0KHJlc3BvbnNlLmNvZGUpXG4gICAgICAgIHNhbmRib3guc2V0Q29tcGlsZXJTZXR0aW5ncyhyZXNwb25zZS5wYXJhbXMpXG5cbiAgICAgICAgLy8gSWYgaXQncyBtdWx0aS1maWxlLCB0aGVuIHRoZXJlJ3Mgd29yayB0byBkb1xuICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS50eXBlID09PSBcInN0b3J5XCIpIHtcbiAgICAgICAgc2hvd05hdigpXG5cbiAgICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKVxuICAgICAgICBpZiAoIW5hdikgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDRcIilcbiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSByZXNwb25zZS50aXRsZVxuICAgICAgICBuYXYuYXBwZW5kQ2hpbGQodGl0bGUpXG5cbiAgICAgICAgLy8gTWFrZSBhbGwgdGhlIHNpZGViYXIgZWxlbWVudHNcbiAgICAgICAgY29uc3QgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIilcbiAgICAgICAgcmVzcG9uc2UuZmlsZXMuZm9yRWFjaCgoZWxlbWVudDogU3RvcnlDb250ZW50LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgY2FzZSBcImNvZGVcIjoge1xuICAgICAgICAgICAgICBsaS5jbGFzc0xpc3QuYWRkKFwic2VsZWN0YWJsZVwiKVxuICAgICAgICAgICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIilcblxuICAgICAgICAgICAgICBsZXQgbG9nbzogc3RyaW5nXG4gICAgICAgICAgICAgIGlmIChlbGVtZW50LnR5cGUgPT09IFwiY29kZVwiKSB7XG4gICAgICAgICAgICAgICAgbG9nbyA9IGA8c3ZnIHdpZHRoPVwiN1wiIGhlaWdodD1cIjdcIiB2aWV3Qm94PVwiMCAwIDcgN1wiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxyZWN0IHdpZHRoPVwiN1wiIGhlaWdodD1cIjdcIiBmaWxsPVwiIzE4N0FCRlwiLz48L3N2Zz5gXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC50eXBlID09PSBcImh0bWxcIikge1xuICAgICAgICAgICAgICAgIGxvZ28gPSBgPHN2ZyB3aWR0aD1cIjlcIiBoZWlnaHQ9XCIxMVwiIHZpZXdCb3g9XCIwIDAgOSAxMVwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxwYXRoIGQ9XCJNOCA1LjVWMy4yNUw2IDFINE04IDUuNVYxMEgxVjFINE04IDUuNUg0VjFcIiBzdHJva2U9XCIjQzRDNEM0XCIvPjwvc3ZnPmBcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2dvID0gXCJcIlxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgYS5pbm5lckhUTUwgPSBgJHtsb2dvfSR7ZWxlbWVudC50aXRsZX1gXG4gICAgICAgICAgICAgIGEuaHJlZiA9IGAvcGxheT8jZ2lzdC8ke2dpc3RJRH0tJHtpfWBcblxuICAgICAgICAgICAgICBhLm9uY2xpY2sgPSBlID0+IHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgICAgICAgICAgICAgIGNvbnN0IGVkID0gc2FuZGJveC5lZGl0b3IuZ2V0RG9tTm9kZSgpXG4gICAgICAgICAgICAgICAgaWYgKCFlZCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KVxuICAgICAgICAgICAgICAgIGNvbnN0IGFscmVhZHlTZWxlY3RlZCA9IHVsLnF1ZXJ5U2VsZWN0b3IoXCIuc2VsZWN0ZWRcIikgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeVNlbGVjdGVkKSBhbHJlYWR5U2VsZWN0ZWQuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpXG5cbiAgICAgICAgICAgICAgICBsaS5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIilcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC50eXBlID09PSBcImNvZGVcIikge1xuICAgICAgICAgICAgICAgICAgc2V0Q29kZShlbGVtZW50LmNvZGUpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnR5cGUgPT09IFwiaHRtbFwiKSB7XG4gICAgICAgICAgICAgICAgICBzZXRTdG9yeShlbGVtZW50Lmh0bWwpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGlzYWJsZS1zYXZlLW9uLXR5cGVcIilcbiAgICAgICAgICAgICAgICBpZiAoYWx3YXlzVXBkYXRlVVJMKSB7XG4gICAgICAgICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gYCNnaXN0LyR7Z2lzdElEfS0ke2l9YFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsaS5hcHBlbmRDaGlsZChhKVxuXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiaHJcIjoge1xuICAgICAgICAgICAgICBjb25zdCBociA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoclwiKVxuICAgICAgICAgICAgICBsaS5hcHBlbmRDaGlsZChocilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpXG4gICAgICAgIH0pXG4gICAgICAgIG5hdi5hcHBlbmRDaGlsZCh1bClcblxuICAgICAgICBjb25zdCB0YXJnZXRlZExpID0gdWwuY2hpbGRyZW4uaXRlbShOdW1iZXIoZ2lzdFN0b3J5SW5kZXgpIHx8IDApIHx8IHVsLmNoaWxkcmVuLml0ZW0oMClcbiAgICAgICAgaWYgKHRhcmdldGVkTGkpIHtcbiAgICAgICAgICBjb25zdCBhID0gdGFyZ2V0ZWRMaS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIikuaXRlbSgwKVxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBpZiAoYSkgYS5jbGljaygpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICB1aS5mbGFzaEluZm8oXCJDb3VsZCBub3QgcmVhY2ggdGhlIGdpc3QgdG8gcGxheWdyb3VuZCBBUEksIGFyZSB5b3UgKG9yIGl0KSBvZmZsaW5lP1wiKVxuICAgICAgcGxheWdyb3VuZC5zdHlsZS5vcGFjaXR5ID0gXCIxXCJcbiAgICAgIHNhbmRib3guZWRpdG9yLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogZmFsc2UgfSlcbiAgICB9KVxufVxuIl19