# [harelyshau.dev](https://harelyshau.dev/)

harelyshau.dev is a frontend project based on [OpenUI5](https://openui5.org/) framework. The application consists of 3 main pages: [Home](https://harelyshau.dev), [Calendar](https://harelyshau.dev/#/calendar) and [Resume](https://harelyshau.dev/#/resume). It supports 3 languages: English, German and Russian. You can also choose the theme of the interface that is convenient for you. On Сalendar page you can see the integration with Google Сalendar and the creation of new appointments using the API. Resume page reads the file and renders content based on it. The project is hosted on GitHub Pages.

## Launch Local

-   Clone Repository `git clone https://github.com/harelyshau/harelyshau.dev.git`
-   Add new folder "webapp" in root of project
-   Move all files to new "webapp" folder
-   Install [UI5 CLI](https://sap.github.io/ui5-tooling/v3/pages/CLI/) `npm install --global @ui5/cli`
-   Launch project with command `ui5 serve`

## Contacts

Currently, the project is still being developed, so any feedbacks and suggestions are welcome.

-  Email: [pavel@harelyshau.dev](mailto:pavel@harelyshau.dev)
-  Report an Issue: [https://github.com/harelyshau/harelyshau.dev/issues/new](https://github.com/harelyshau/harelyshau.dev/issues/new)

## Disclaimer

Although the project is written on OpenUI5 framework, it does not meet all the requirements of the [SAP Fiori Guidelines](https://experience.sap.com/fiori-design-web/).

For example, on the Home Page, you can see that I'm using the sap.m.IllustratedMessage control for other purposes. However, I do not see another alternative that is as convenient and fast to develop (it is drawn and fully responsive out of the box) for my case.

But if you have any suggestions for improvement let me know.
