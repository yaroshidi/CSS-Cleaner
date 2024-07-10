var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => __awaiter(this, void 0, void 0, function* () {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanForDuplicates);
    }
}));
let stylesWithProperties = [];
function scanForDuplicates() {
    return __awaiter(this, void 0, void 0, function* () {
        showLoading();
        const container = document.getElementById('duplicates-container');
        if (container)
            container.style.display = 'none';
        try {
            const allStyles = yield webflow.getAllStyles();
            stylesWithProperties = [];
            for (const style of allStyles) {
                const styleName = yield style.getName();
                const properties = yield style.getProperties();
                stylesWithProperties.push({
                    name: styleName,
                    properties: properties
                });
            }
            const result = detectDuplicates(stylesWithProperties);
            const styles = result['duplicates'].flat();
            const elements = yield searchPagesForElements(styles);
            displayDuplicatesAndEmptyStyles(result, elements);
        }
        catch (error) {
            console.error('Error scanning for duplicates:', error);
        }
        finally {
            hideLoading();
            if (container)
                container.style.display = 'block';
        }
    });
}
const searchPagesForElements = (styles) => __awaiter(this, void 0, void 0, function* () {
    let elementsWithStyle = [];
    try {
        const pages = yield webflow.getAllPagesAndFolders();
        for (const page of pages) {
            const pageName = yield page.getName();
            try {
                if (page.type === 'Page')
                    yield webflow.switchPage(page);
                elementsWithStyle = elementsWithStyle.concat(yield searchPageForElements(styles, (page === null || page === void 0 ? void 0 : page.id) || '', pageName));
            }
            catch (error) {
                console.error('Error scanning for duplicates:', error);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
    return elementsWithStyle;
});
const searchPageForElements = (styles, pageId, pageName) => __awaiter(this, void 0, void 0, function* () {
    try {
        const allElements = yield webflow.getAllElements();
        const elementsWithStyle = [];
        for (const element of allElements) {
            if (element.styles) {
                const elementStyles = yield element.getStyles();
                elementStyles.forEach((style) => __awaiter(this, void 0, void 0, function* () {
                    const styleName = yield style.getName();
                    if (styles.includes(styleName)) {
                        const el = {
                            pageId: pageId,
                            pageName: pageName,
                            elementId: element.id.element,
                            style: styleName
                        };
                        elementsWithStyle.push(el);
                    }
                }));
            }
        }
        ;
        return elementsWithStyle;
    }
    catch (error) {
        console.log(error);
    }
});
function detectDuplicates(styles) {
    const duplicates = [];
    const processed = new Set();
    for (let i = 0; i < styles.length; i++) {
        const { name: name1, properties: properties1 } = styles[i];
        if (Object.keys(properties1).length === 0) {
            processed.add(i);
            continue;
        }
        if (processed.has(i))
            continue; // could be extra line
        const duplicateGroup = [name1];
        for (let j = i + 1; j < styles.length; j++) {
            if (processed.has(j))
                continue;
            const { name: name2, properties: properties2 } = styles[j];
            if (JSON.stringify(properties1) === JSON.stringify(properties2)) {
                duplicateGroup.push(name2);
                processed.add(j);
            }
        }
        if (duplicateGroup.length > 1) {
            duplicates.push(duplicateGroup);
        }
        processed.add(i);
    }
    return { duplicates };
}
function displayDuplicatesAndEmptyStyles(data, elements) {
    const container = document.getElementById('duplicates-container');
    const elementsByStyles = elements.reduce((acc, el) => {
        (acc[el.style] = acc[el.style] || []).push(el);
        return acc;
    }, {});
    if (container) {
        container.innerHTML = '';
        data.duplicates.forEach((group, index) => {
            const style = stylesWithProperties.find(s => s.name === group[0]);
            const propertiesText = JSON.stringify(style === null || style === void 0 ? void 0 : style.properties, null, 2);
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('duplicate-group');
            const groupTitle = document.createElement('h3');
            groupTitle.classList.add('group-title');
            groupTitle.textContent = `Duplicates group (${index + 1})`;
            const propertiesDiv = document.createElement('div');
            propertiesDiv.classList.add('properties-text');
            propertiesDiv.textContent = propertiesText;
            groupDiv.appendChild(groupTitle);
            groupDiv.appendChild(propertiesDiv);
            const ul = document.createElement('ul');
            group.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                li.addEventListener('click', () => {
                    const elements = elementsByStyles[name];
                });
                ul.appendChild(li);
            });
            groupDiv.appendChild(ul);
            container.appendChild(groupDiv);
        });
        const emptyContainer = document.createElement('div');
        emptyContainer.classList.add('empty-styles');
        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = 'Empty Styles';
        emptyContainer.appendChild(emptyTitle);
        const ul = document.createElement('ul');
        emptyContainer.appendChild(ul);
        container.appendChild(emptyContainer);
    }
}
const getElementsWithStyle = (style) => __awaiter(this, void 0, void 0, function* () {
    // Retrieve all elements in the current context
    const allElements = yield webflow.getAllElements();
    // Print element list
    if (allElements.length > 0) {
        allElements.forEach((element, index) => __awaiter(this, void 0, void 0, function* () {
            console.log({ elementId: element.id, styles: element.styles });
            // const element = allElements[0]
            if (element.styles) {
                const styles = yield element.getStyles();
            }
        }));
    }
    else {
        console.log('No elements found in the current context.');
    }
});
function selectStyleInWebflow(styleName) {
    // Escape the style name and replace spaces with dots for valid CSS selector
    const escapedStyleName = CSS.escape(styleName).replace(/ /g, '.');
    const selector = `.${escapedStyleName}`;
    console.log(`Attempting to select element with selector: ${selector}`);
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements.forEach(element => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.click();
                console.log(`Successfully selected style: ${styleName}`);
            });
        }
        else {
            console.log(`No elements found for style: ${styleName}`);
        }
    }
    catch (error) {
        console.error(`Error selecting element with selector: ${selector}`, error);
    }
}
// Loading functions
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}
// Example function to get all styles and log their names
function getAllStylesAndLogNames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allStyles = yield webflow.getAllStyles();
            if (allStyles.length > 0) {
                console.log("List of all styles:");
                for (let i = 0; i < allStyles.length; i++) {
                    const style = allStyles[i];
                    const styleName = yield style.getName();
                    console.log(`${i + 1}. Style Name: ${styleName}, Style ID: ${style.id}`);
                }
            }
            else {
                console.log("No styles found in the current context.");
            }
        }
        catch (error) {
            console.error('Error retrieving styles:', error);
        }
    });
}
