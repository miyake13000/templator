// グローバル変数
let currentTemplate = null;
let currentTemplateId = null;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
});


// テンプレート一覧を読み込む
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const templates = await response.json();

        const listContainer = document.getElementById('templates-list');

        if (templates.length === 0) {
            listContainer.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 40px;">テンプレートが登録されていません</p>';
            return;
        }

        listContainer.innerHTML = templates.map(template => `
            <div class="template-item">
              <h3>${escapeHtml(template.name)}</h3>
              <div id="template-edit-form-container-${template.id}">
                <div class="template-item-variables">
                  <h4>変数:</h4>
                  ${template.variables.map(varConfig => {
                      return `<span class="variable-tag">${varConfig.name} (${varConfig.type})</span>`;
                  }).join('')}
                </div>
                <details class="template-item-details">
                  <summary class="template-content-summary">テンプレート本文を表示</summary>
                  <pre class="template-content">${escapeHtml(template.template)}</pre>
                </details>
                <div class="template-item-actions">
                  <button class="btn btn-secondary" onclick="editTemplate(${template.id})">編集</button>
                  <button class="btn btn-danger" onclick="deleteTemplate(${template.id}, '${escapeHtml(template.name)}')">削除</button>
                </div>
              </div>
            </div>
        `).join('');
    } catch (error) {
        showResult('edit-result', `テンプレートの読み込みに失敗しました: ${error.message}`, true);
    }
}


// テンプレートを編集
async function editTemplate(templateId) {
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        const template = await response.json();

        // テンプレート詳細を表示するフォームを作成
        const editFormContainer = document.getElementById(`template-edit-form-container-${template.id}`);
        editFormContainer.innerHTML = `
          <form id="edit-template-form">
            <div class="form-group">
              <label for="edit-template-name">テンプレート名 *</label>
              <input type="text" id="edit-template-name" value="${escapeHtml(template.name)}" required>
            </div>

            <div class="form-group">
              <label for="edit-template-text">テンプレート内容 *</label>
              <textarea id="edit-template-text" rows="10" required>${escapeHtml(template.template)}</textarea>
            </div>

            <button type="submit" class="btn btn-primary">テンプレートを更新</button>
          </form>
        `;

        const editForm = document.getElementById('edit-template-form');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updatedName = document.getElementById('edit-template-name').value;
            const updatedContent = document.getElementById('edit-template-text').value;

            try {
                const updateResponse = await fetch(`/api/templates/${templateId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: updatedName, template: updatedContent })
                });

                if (updateResponse.ok) {
                    showResult('edit-result', `"${updatedName}" を更新しました`, false);
                    loadTemplates(); // 一覧を更新
                } else {
                    const errorResult = await updateResponse.json();
                    showResult('edit-result', `"${updatedName}" の更新に失敗しました: ${errorResult.error}`, true);

                }
            } catch (updateError) {
                showResult('edit-result', `通信エラー: ${updateError.message}`, true);
            }
        });
    } catch (error) {
        showResult('edit-result', `テンプレートの読み込みに失敗しました: ${error.message}`, true);
    }
}

// テンプレート削除
async function deleteTemplate(templateId, templateName) {
    if (!confirm(`"${templateName}" を削除してもよろしいですか?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showResult('edit-result', `"${templateName}" を削除しました`, false);
            loadTemplates();
        } else {
            const errorResult = await updateResponse.json();
            showResult('edit-result', `"${templateName}" の削除に失敗しました: ${errorResult.error}`, true);
        }
    } catch (error) {
        showResult('edit-result', `通信エラー: ${error.message}`, true);
    }
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
