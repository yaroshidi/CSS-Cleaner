var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanForDuplicates);
    }
});
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
            displayDuplicatesAndEmptyStyles(result);
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
function detectDuplicates(styles) {
    const duplicates = [];
    const emptyStyles = [];
    const processed = new Set();
    for (let i = 0; i < styles.length; i++) {
        const { name: name1, properties: properties1 } = styles[i];
        if (Object.keys(properties1).length === 0) {
            emptyStyles.push(name1);
            processed.add(i);
            continue;
        }
        if (processed.has(i))
            continue;
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
    return { duplicates, emptyStyles };
}
function displayDuplicatesAndEmptyStyles(data) {
    const container = document.getElementById('duplicates-container');
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
                ul.appendChild(li);
            });
            groupDiv.appendChild(ul);
            const newClassInputDiv = document.createElement('div');
            newClassInputDiv.classList.add('new-class-input');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    input.style.display = 'inline';
                    submitButton.style.display = 'inline';
                }
                else {
                    input.style.display = 'none';
                    submitButton.style.display = 'none';
                }
            });
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'New class name';
            const submitButton = document.createElement('button');
            submitButton.textContent = 'Replace';
            submitButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                const newClassName = input.value.trim();
                if (newClassName) {
                    yield replaceDuplicateGroup(group, newClassName, style === null || style === void 0 ? void 0 : style.properties);
                }
            }));
            newClassInputDiv.appendChild(checkbox);
            newClassInputDiv.appendChild(input);
            newClassInputDiv.appendChild(submitButton);
            groupDiv.appendChild(newClassInputDiv);
            container.appendChild(groupDiv);
        });
        const emptyContainer = document.createElement('div');
        emptyContainer.classList.add('empty-styles');
        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = 'Empty Styles';
        emptyContainer.appendChild(emptyTitle);
        const ul = document.createElement('ul');
        data.emptyStyles.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            ul.appendChild(li);
        });
        emptyContainer.appendChild(ul);
        container.appendChild(emptyContainer);
    }
}
function replaceDuplicateGroup(group, newClassName, properties) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingStyles = yield webflow.getAllStyles();
            const existingStyleNames = yield Promise.all(existingStyles.map(style => style.getName()));
            if (existingStyleNames.includes(newClassName)) {
                throw new Error(`Class name "${newClassName}" already exists.`);
            }
            const newStyle = yield webflow.createStyle(newClassName);
            yield newStyle.setProperties(properties);
            const allElements = yield webflow.getAllElements();
            for (const element of allElements) {
                if (Array.isArray(element.styles)) {
                    for (const style of element.styles) {
                        const styleName = yield style.getName();
                        if (group.includes(styleName)) {
                            for (const property in properties) {
                                if (properties.hasOwnProperty(property)) {
                                    yield style.removeProperty(property);
                                }
                            }
                            yield newStyle.setProperties(properties);
                            break;
                        }
                    }
                }
            }
            location.reload();
        }
        catch (error) {
            console.error('Error replacing duplicate group:', error);
        }
    });
}
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
