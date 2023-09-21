sap.ui.define([], () => {
	'use strict';

	return {
        Articles: [
            {
                Title: "Search Algorithms",
                Icon: "sap-icon://browse-folder",
                Articles: [
                    {
                        ID: "binary-search",
                        Title: "Binary Search"
                    },
                    {
                        ID: "breadth-first-search",
                        Title: "Breadth-First Search, BFS"
                    },
                    {
                        ID: "depth-first-search",
                        Title: "Depth-First Search, DFS"
                    }
                ]
            },
            {
                ID: "recursion",
                Title: "Recursion",
                Icon: "sap-icon://synchronize"
            }
        ]
    };
});
