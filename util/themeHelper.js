sap.ui.define([], function () {
    
    "use strict";

    return {

        getTheme: function () {
            return localStorage.getItem("theme");
        },

        setTheme: function (sTheme) {
            // set up received theme
            let sThemeSAP = sTheme ?? "auto";
            if (sThemeSAP === 'auto') {
                const bLight = window.matchMedia("(prefers-color-scheme: light)").matches;
                sThemeSAP = bLight ? 'sap_horizon' : 'sap_horizon_dark';
            }

            // write and apply theme
            if (sTheme) {
                localStorage.setItem("theme", sTheme);
            }
            sap.ui.getCore().applyTheme(sThemeSAP);
        },

        initTheme: function () {
            const sTheme = this.getTheme();
            this.setTheme(sTheme);
        }
        
    };
});