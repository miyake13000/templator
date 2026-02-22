#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Templator - Template and Form Generator
"""

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from jinja2 import Template as JinjaTemplate
import re
import argparse
from datetime import datetime

DB_FILE_NAME = "db.sqlite3"

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_FILE_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# DB for storing templates
db = SQLAlchemy(app)


class Template(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    content = db.Column(db.String(10000), unique=False, nullable=False)


class TemplateParser:
    """テンプレートから変数情報を抽出するパーサー"""

    @staticmethod
    def parse_variable_definitions(template_text):
        """
        テンプレート内のコメントから変数定義を抽出
        形式: {# @variable name: type=string, label="名前", required=true #}
        """
        variable_pattern = r'\{#-\s*@variable\s+(\w+):\s*([^-]+)-#\}'
        variables = []

        matches = re.finditer(variable_pattern, template_text)
        for match in matches:
            var_name = match.group(1)
            var_config_str = match.group(2)

            # 設定をパース
            config = TemplateParser._parse_config(var_config_str)
            config['name'] = var_name
            variables.append(config)

        return variables

    @staticmethod
    def _parse_config(config_str):
        """変数の設定文字列をパース"""
        config = {
            'type': 'string',
            'label': None,
            'required': False,
            'options': [],
            'min': None,
            'max': None,
            'default': None,
            'placeholder': None,
            'description': None
        }

        # key=value 形式をパース
        parts = re.findall(r'(\w+)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|\[([^\]]*)\]|(\d+(?:\.\d+)?)|(\w+))', config_str)

        for part in parts:
            key = part[0]
            # 値を取得（どのグループにマッチしたかで判定）
            value = part[1] or part[2] or part[3] or part[4] or part[5]

            if key == 'type':
                config['type'] = value
            elif key == 'label':
                config['label'] = value
            elif key == 'required':
                config['required'] = value.lower() == 'true'
            elif key == 'options':
                # 配列形式をパース
                options = [opt.strip().strip('"').strip("'") for opt in value.split(',')]
                config['options'] = options
            elif key == 'min':
                config['min'] = int(value) if value.isdigit() else float(value)
            elif key == 'max':
                config['max'] = int(value) if value.isdigit() else float(value)
            elif key == 'default':
                config['default'] = value
            elif key == 'placeholder':
                config['placeholder'] = value
            elif key == 'description':
                config['description'] = value

        # labelが未設定の場合は変数名を使用
        if config['label'] is None:
            config['label'] = config['name'] if 'name' in config else ''

        return config

    @staticmethod
    def extract_all_variables(template_text):
        """
        テンプレート内のすべての変数を抽出
        """
        defined_vars = TemplateParser.parse_variable_definitions(template_text)
        return defined_vars


@app.route('/')
def index():
    """メインページ"""
    return render_template('home.html')


@app.route('/list')
def list():
    """一覧ページ"""
    return render_template('list.html')


@app.route('/help')
def help():
    """ヘルプページ"""
    return render_template('help.html')


@app.route('/api/templates', methods=['POST'])
def create_template():
    """新しいテンプレートを登録"""
    data = request.json
    template_name = data.get('name')
    template_text = data.get('template')

    if not template_name or not template_text:
        return jsonify({'error': 'Name and template are required'}), 400

    # テンプレートから変数を抽出
    try:
        variables = TemplateParser.extract_all_variables(template_text)
    except Exception as e:
        return jsonify({'error': f'Template parsing error: {str(e)}'}), 400

    # テンプレートを保存
    new_template = Template(name=template_name, content=template_text)
    db.session.add(new_template)
    db.session.commit()

    return jsonify({
        'id': new_template.id,
        'name': new_template.name,
        'variables': variables
    })


@app.route('/api/templates', methods=['GET'])
def list_templates():
    """登録済みテンプレート一覧を取得"""
    templates = Template.query.all()
    result = []
    for tmpl in templates:
        variables = TemplateParser.extract_all_variables(tmpl.content)
        result.append({
            'id': tmpl.id,
            'name': tmpl.name,
            'template': tmpl.content,
            'variables': variables
        })
    return jsonify(result)


@app.route('/api/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """特定のテンプレート情報を取得"""
    tmpl = Template.query.get(template_id)
    if tmpl is None:
        return jsonify({'error': 'Template not found'}), 404

    variables = TemplateParser.extract_all_variables(tmpl.content)
    return jsonify({
        'id': tmpl.id,
        'name': tmpl.name,
        'template': tmpl.content,
        'variables': variables
    })


@app.route('/api/templates/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """特定のテンプレートを更新"""
    data = request.json
    template_name = data.get('name')
    template_text = data.get('template')

    if not template_name or not template_text:
        return jsonify({'error': 'Name and template are required'}), 400

    tmpl = Template.query.get(template_id)
    if tmpl is None:
        return jsonify({'error': 'Template not found'}), 404

    # テンプレートから変数を抽出
    try:
        variables = TemplateParser.extract_all_variables(template_text)
    except Exception as e:
        return jsonify({'error': f'Template parsing error: {str(e)}'}), 400

    # テンプレートを保存
    tmpl.name = template_name
    tmpl.content = template_text
    db.session.commit()

    return jsonify({
        'id': tmpl.id,
        'name': tmpl.name,
        'variables': variables
    })


@app.route('/api/templates/<int:template_id>/render', methods=['POST'])
def render_template_endpoint(template_id):
    """テンプレートをレンダリング"""
    tmpl = Template.query.get(template_id)
    if tmpl is None:
        return jsonify({'error': 'Template not found'}), 404

    user_inputs = request.json
    variables = TemplateParser.extract_all_variables(tmpl.content)

    # 入力値の型変換
    converted_inputs = {}
    for var in variables:
        var_name = var['name']
        if var_name in user_inputs:
            value = user_inputs[var_name]
            var_type = var['type']

            # 型に応じて変換
            if var_type == 'integer':
                try:
                    converted_inputs[var_name] = int(value)
                except (ValueError, TypeError):
                    converted_inputs[var_name] = 0
            elif var_type == 'number':
                try:
                    converted_inputs[var_name] = float(value)
                except (ValueError, TypeError):
                    converted_inputs[var_name] = 0.0
            elif var_type == 'datetime':
                try:
                    converted_inputs[var_name] = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted_inputs[var_name] = datetime.datetime.now()
            elif var_type == 'boolean':
                converted_inputs[var_name] = value in [True, 'true', 'True', 1, '1']
            elif var_type == 'array':
                if isinstance(value, str):
                    # 改行が含まれている場合は改行で分割、そうでない場合はカンマで分割
                    if '\n' in value:
                        converted_inputs[var_name] = [v.strip() for v in value.split('\n') if v.strip()]
                    else:
                        converted_inputs[var_name] = [v.strip() for v in value.split(',')]
                elif isinstance(value, list):
                    converted_inputs[var_name] = value
                else:
                    converted_inputs[var_name] = [str(value)]
            else:
                converted_inputs[var_name] = str(value)
        else:
            # デフォルト値を設定
            if var.get('default'):
                converted_inputs[var_name] = var['default']

    # テンプレートをレンダリング
    try:
        template = JinjaTemplate(tmpl.content)
        rendered_text = template.render(**converted_inputs)

        return jsonify({
            'result': rendered_text,
            'inputs': converted_inputs
        })
    except Exception as e:
        return jsonify({'error': f'Rendering error: {str(e)}'}), 400


@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """テンプレートを削除"""
    tmpl = Template.query.get(template_id)
    if tmpl is None:
        return jsonify({'error': 'Template not found'}), 404

    template_name = tmpl.name
    db.session.delete(tmpl)
    db.session.commit()

    return jsonify({'message': 'Template deleted', 'name': template_name})


if __name__ == '__main__':
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Templator - Template and Form Generator')
    parser.add_argument('-d', '--debug', action='store_true',
                        help='Enable debug mode')
    parser.add_argument('-b', '--bind', type=str, default='127.0.0.1',
                        help='Bind address (default: 127.0.0.1)')
    parser.add_argument('-p', '--port', type=int, default=8000,
                        help='Bind port (default: 8000)')

    args = parser.parse_args()

    with app.app_context():
        db.create_all()

    app.run(debug=args.debug, host=args.bind, port=args.port)
