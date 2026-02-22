// グローバル変数
let currentTemplate = null;
let currentTemplateId = null;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    initCreateTemplateForm();
    loadTemplateSelect();
});

// テンプレート登録フォームの初期化
function initCreateTemplateForm() {
    const form = document.getElementById('create-template-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('template-name').value;
        const template = document.getElementById('template-text').value;

        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, template })
            });

            const result = await response.json();

            if (response.ok) {
                showResult('create-result', `"${result.name}" を登録しました\n変数: ${Object.keys(result.variables).length}個`, false);
                form.reset();

                // 一覧とセレクトボックスを更新
                loadTemplateSelect();
            } else {
                showResult('create-result', `エラー: ${result.error}`, true);
            }
        } catch (error) {
            showResult('create-result', `通信エラー: ${error.message}`, true);
        }
    });
}

// 結果メッセージを表示
function showResult(elementId, message, isError) {
    const resultBox = document.getElementById(elementId);
    resultBox.textContent = message;
    resultBox.className = isError ? 'result-box error' : 'result-box';
    resultBox.style.display = 'block';

    // 5秒後に自動的に非表示
    setTimeout(() => {
        resultBox.style.display = 'none';
    }, 5000);
}


// テンプレート選択用のセレクトボックスを更新
async function loadTemplateSelect() {
    try {
        const response = await fetch('/api/templates');
        const templates = await response.json();

        const select = document.getElementById('template-select');
        select.innerHTML = '<option value="">-- テンプレートを選択 --</option>';

        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            select.appendChild(option);
        });
    } catch (error) {
        showResult('create-result', `テンプレートの読み込みに失敗しました: ${error.message}`, true);
    }
}


// テンプレートを読み込んでフォームを生成
async function loadTemplateForGeneration() {
    const selectElement = document.getElementById('template-select');
    const templateId = selectElement.value;

    if (!templateId) {
        document.getElementById('dynamic-form-container').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/templates/${templateId}`);
        const template = await response.json();

        currentTemplate = template;
        currentTemplateId = templateId;

        // 動的フォームを生成
        generateDynamicForm(template.variables);

        // フォームコンテナを表示
        document.getElementById('dynamic-form-container').style.display = 'block';
        document.getElementById('output-container').style.display = 'none';
    } catch (error) {
        alert('テンプレートの読み込みに失敗しました');
    }
}

// 動的フォームを生成
function generateDynamicForm(variables) {
    const form = document.getElementById('dynamic-form');
    form.innerHTML = '';

    variables.forEach(varConfig => {
        const varName = varConfig.name;

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', `input-${varName}`);
        label.textContent = varConfig.label || varName;

        if (varConfig.required) {
            const requiredMark = document.createElement('span');
            requiredMark.className = 'required-mark';
            requiredMark.textContent = '*';
            label.appendChild(requiredMark);
        }

        formGroup.appendChild(label);

        // 型に応じた入力要素を生成
        let inputElement;

        switch (varConfig.type) {
            case 'boolean':
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'checkbox-wrapper';

                inputElement = document.createElement('input');
                inputElement.type = 'checkbox';
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;

                if (varConfig.default === 'true' || varConfig.default === true) {
                    inputElement.checked = true;
                }

                checkboxWrapper.appendChild(inputElement);
                formGroup.appendChild(checkboxWrapper);
                break;

            case 'select':
                inputElement = document.createElement('select');
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;

                if (!varConfig.required) {
                    const emptyOption = document.createElement('option');
                    emptyOption.value = '';
                    emptyOption.textContent = '-- 選択してください --';
                    inputElement.appendChild(emptyOption);
                }

                if (varConfig.options && varConfig.options.length > 0) {
                    varConfig.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        if (option === varConfig.default) {
                            optionElement.selected = true;
                        }
                        inputElement.appendChild(optionElement);
                    });
                }

                formGroup.appendChild(inputElement);
                break;

            case 'integer':
            case 'number':
                inputElement = document.createElement('input');
                inputElement.type = 'number';
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;

                if (varConfig.type === 'integer') {
                    inputElement.step = '1';
                } else {
                    inputElement.step = 'any';
                }

                if (varConfig.min !== null && varConfig.min !== undefined) {
                    inputElement.min = varConfig.min;
                }
                if (varConfig.max !== null && varConfig.max !== undefined) {
                    inputElement.max = varConfig.max;
                }
                if (varConfig.default !== null && varConfig.default !== undefined) {
                    inputElement.value = varConfig.default;
                }
                if (varConfig.placeholder) {
                    inputElement.placeholder = varConfig.placeholder;
                }
                if (varConfig.required) {
                    inputElement.required = true;
                }

                formGroup.appendChild(inputElement);
                break;

            case 'datetime':
                inputElement = document.createElement('input');
                inputElement.type = 'datetime-local';
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;

                if (varConfig.default !== null && varConfig.default !== undefined) {
                    inputElement.value = varConfig.default;
                }
                if (varConfig.placeholder) {
                    inputElement.placeholder = varConfig.placeholder;
                }
                if (varConfig.required) {
                    inputElement.required = true;
                }

                formGroup.appendChild(inputElement);
                break;

            case 'array':
                inputElement = document.createElement('textarea');
                // inputElement.type = 'text';
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;
                inputElement.placeholder = varConfig.placeholder || 'カンマ or 改行区切りで入力';

                if (varConfig.default) {
                    inputElement.value = varConfig.default;
                }
                if (varConfig.required) {
                    inputElement.required = true;
                }

                formGroup.appendChild(inputElement);

                const arrayHelp = document.createElement('div');
                arrayHelp.className = 'field-description';
                arrayHelp.textContent = '※ 改行があれば改行で，なければカンマで分割されます';
                formGroup.appendChild(arrayHelp);
                break;

            default: // string
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.id = `input-${varName}`;
                inputElement.name = varName;

                if (varConfig.placeholder) {
                    inputElement.placeholder = varConfig.placeholder;
                }
                if (varConfig.default) {
                    inputElement.value = varConfig.default;
                }
                if (varConfig.required) {
                    inputElement.required = true;
                }

                formGroup.appendChild(inputElement);
                break;
        }

        // 説明文があれば追加
        if (varConfig.description) {
            const description = document.createElement('div');
            description.className = 'field-description';
            description.textContent = varConfig.description;
            formGroup.appendChild(description);
        }

        form.appendChild(formGroup);
    });
}

// テキストを生成
async function generateText() {
    if (!currentTemplateId) {
        alert('テンプレートが選択されていません');
        return;
    }

    // フォームデータを収集
    const inputs = {};
    currentTemplate.variables.forEach(varConfig => {
        const varName = varConfig.name;
        const inputElement = document.getElementById(`input-${varName}`);

        if (varConfig.type === 'boolean') {
            inputs[varName] = inputElement.checked;
        } else if (varConfig.type === 'array') {
            inputs[varName] = inputElement.value;
        } else {
            inputs[varName] = inputElement.value;
        }
    });

    try {
        const response = await fetch(`/api/templates/${currentTemplateId}/render`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputs)
        });

        const result = await response.json();

        if (response.ok) {
            // 結果を表示
            document.getElementById('output-text').textContent = result.result;
            document.getElementById('output-container').style.display = 'block';

            // 結果までスクロール
            document.getElementById('output-container').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert(`エラー: ${result.error}`);
        }
    } catch (error) {
        alert(`通信エラー: ${error.message}`);
    }
}

// クリップボードにコピー
function copyToClipboard() {
    const outputText = document.getElementById('output-text').textContent;
    navigator.clipboard.writeText(outputText).then(() => {
        alert('クリップボードにコピーしました');
    }).catch(err => {
        alert('コピーに失敗しました');
    });
}

// テキストをダウンロード
function downloadText() {
    const outputText = document.getElementById('output-text').textContent;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// HTMLエスケープ
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
