sap.ui.define([], function () {
    
    "use strict";

    return {

        getTheme() {
            return localStorage.getItem("theme");
        },

        setTheme(sTheme) {
            // set up received theme
            let sThemeSAP = sTheme ?? "auto";
            if (sThemeSAP === 'auto') {
                const bLight = window.matchMedia("(prefers-color-scheme: light)").matches;
                sThemeSAP = bLight ? 'sap_horizon' : 'sap_horizon_dark';
            }

            // write and apply theme
            if (sTheme) {
                localStorage.setItem("theme", sTheme);
            } else {
                localStorage.removeItem("theme");
            }
            sap.ui.getCore().applyTheme(sThemeSAP);
        },

        initTheme() {
            const sTheme = this.getTheme();
            this.setTheme(sTheme);
        }
        
    };
});