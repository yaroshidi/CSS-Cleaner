document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanForDuplicates);
    }
});

let stylesWithProperties: Array<{ name: string, properties: any }> = [];

async function scanForDuplicates(): Promise<void> {
    showLoading();
    const container = document.getElementById('duplicates-container') as HTMLElement;
    if (container) container.style.display = 'none';

    try {
        const allStyles = await webflow.getAllStyles();
        stylesWithProperties = [];

        for (const style of allStyles) {
            const styleName = await style.getName();
            const properties = await style.getProperties();
            stylesWithProperties.push({
                name: styleName,
                properties: properties
            });
        }

        const result = detectDuplicates(stylesWithProperties);
        displayDuplicatesAndEmptyStyles(result);
    } catch (error) {
        console.error('Error scanning for duplicates:', error);
    } finally {
        hideLoading();
        if (container) container.style.display = 'block';
    }
}

function detectDuplicates(styles: Array<{ name: string, properties: any }>) {
    const duplicates: Array<Array<string>> = [];
    const emptyStyles: Array<string> = [];
    const processed = new Set<number>();

    for (let i = 0; i < styles.length; i++) {
        const { name: name1, properties: properties1 } = styles[i];
        if (Object.keys(properties1).length === 0) {
            emptyStyles.push(name1);
            processed.add(i);
            continue;
        }
        if (processed.has(i)) continue;
        const duplicateGroup: Array<string> = [name1];
        for (let j = i + 1; j < styles.length; j++) {
            if (processed.has(j)) continue;
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

function displayDuplicatesAndEmptyStyles(data: { duplicates: Array<Array<string>>, emptyStyles: Array<string> }): void {
    const container = document.getElementById('duplicates-container') as HTMLElement;
    if (container) {
        container.innerHTML = '';

        data.duplicates.forEach((group, index) => {
            const style = stylesWithProperties.find(s => s.name === group[0]);
            const propertiesText = JSON.stringify(style?.properties, null, 2);

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
                } else {
                    input.style.display = 'none';
                    submitButton.style.display = 'none';
                }
            });

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'New class name';

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Replace';
            submitButton.addEventListener('click', async () => {
                const newClassName = input.value.trim();
                if (newClassName) {
                    await replaceDuplicateGroup(group, newClassName, style?.properties);
                }
            });

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

async function replaceDuplicateGroup(group: Array<string>, newClassName: string, properties: any) {
    try {
        const existingStyles = await webflow.getAllStyles();
        const existingStyleNames = await Promise.all(existingStyles.map(style => style.getName()));

        if (existingStyleNames.includes(newClassName)) {
            throw new Error(`Class name "${newClassName}" already exists.`);
        }

        const newStyle = await webflow.createStyle(newClassName);
        await newStyle.setProperties(properties);

        const allElements = await webflow.getAllElements();
        for (const element of allElements) {
            if (Array.isArray(element.styles)) {
                for (const style of element.styles) {
                    const styleName = await style.getName();
                    if (group.includes(styleName)) {
                        for (const property in properties) {
                            if (properties.hasOwnProperty(property)) {
                                await style.removeProperty(property);
                            }
                        }
                        await newStyle.setProperties(properties);
                        break;
                    }
                }
            }
        }

        location.reload();
    } catch (error) {
        console.error('Error replacing duplicate group:', error);
    }
}

function showLoading() {
    const loadingElement = document.getElementById('loading') as HTMLElement;
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading') as HTMLElement;
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}
