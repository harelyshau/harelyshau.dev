sap.ui.define([], function () {
    
    "use strict";

    return {

        getTheme() {
            return localStorage.getItem("theme");
        },

        setTheme(sThemeKey) {
            // set up received theme
            let sThemeSAP = this.mapTheme(sThemeKey) ?? "auto";
            if (sThemeSAP === "auto") {
                const bLight = window.matchMedia("(prefers-color-scheme: light)").matches;
                sThemeSAP = bLight ? this.mapTheme("light") : this.mapTheme("dark");
            }

            // write and apply theme
            if (sThemeKey) {
                localStorage.setItem("theme", sThemeKey);
            } else {
                localStorage.removeItem("theme");
            }
            sap.ui.getCore().applyTheme(sThemeSAP);
        },

        mapTheme(sKey, sValue) {
            const oThemes = {
                light: "sap_horizon",
                dark: "sap_horizon_dark",
                contrastWhite: "sap_horizon_hcw",
                contrastBlack: "sap_horizon_hcb"
            }
            if (sKey) { // return value by key
                return oThemes[sKey];
            } else if (sValue) { // return key by value
                return Object.keys(oThemes).find(sThemeKey => oThemes[sThemeKey] === sValue);
            }
            
        },

        initTheme() {
            const sTheme = this.getTheme();
            this.setTheme(sTheme);
        }
        
    };
});