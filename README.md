# Templator

Templator: Template generator based on Jinja2

[日本語](README_ja.md)

## Features
- ✅ Register templates in text format
- ✅ Insert variables and conditional loops in templates
- ✅ Input values for variables via a web interface
- ✅ Automatically generate forms based on variables in templates
- ✅ Define variable types (string, integer, boolean, select, etc.) and possible values
- ✅ Display input forms tailored to the defined types (e.g., text fields, dropdowns, checkboxes)

## Setup
### Prerequisites
- Python >= 3.8
- Libraries:
  - Flask
  - Jinja2

### Installation

```bash
pip install flask jinja2
```

### Launch

```bash
python app.py -d -b 127.0.0.1 -p 8000
# -d: Debug mode
# -b: Bind address
# -p: Bind port
```

Once the server has launched, access it via your browser at `http://localhost:8000`.

## Template Grammar

### Variable Definition

Define variables in the templates using the comment syntax:

```
{# @variable variable_name: type=type_name, option1=value1, option2=value2 #}
```

### Supported Types

- `string` - Text input
- `integer` - Integer input
- `number` - Numeric input (supports decimals)
- `boolean` - Checkbox
- `select` - Dropdown list (requires specified `options`)
- `array` - Comma-separated list

### Options

- `label` - Label displayed in the form
- `required` - Specifies whether the field is mandatory (true/false)
- `options` - Array of choices (for `select` type)
- `min`, `max` - Minimum and maximum value (for numeric inputs)
- `default` - Default value
- `placeholder` - Placeholder text
- `description` - Description or help text for the field

### Jinja2 Syntax
- Variables: `{{ variable }}`
- Loops: `{% for item in items %}...{% endfor %}`
- Conditions: `{% if condition %}...{% endif %}`


## Examples
### 1. Business Email Template

```jinja2
{# @variable recipient_name: type=string, label="Recipient Name", required=true, placeholder="John Doe" #}
{# @variable sender_name: type=string, label="Sender Name", required=true, placeholder="Jane Smith" #}
{# @variable subject: type=string, label="Subject", required=true #}
{# @variable urgent: type=boolean, label="Urgency Flag", default=false #}
{# @variable department: type=select, label="Department", options=["Sales", "Development", "HR", "Administration"], required=true #}

{% if urgent %}【URGENT】{% endif %}{{ subject }}

Dear {{ recipient_name }},

This is {{ sender_name }} from {{ department }}.

I am reaching out regarding {{ subject }}.

{% if urgent %}
※ Please confirm on an urgent basis.
{% endif %}

Looking forward to your response.

---
{{ sender_name }}
{{ department }}
```


### 2. Task List Template

```jinja2
{# @variable project_name: type=string, label="Project Name", required=true #}
{# @variable tasks: type=array, label="Task Contents", required=true #}
{# @variable priority: type=select, label="Priority", options=["high", "mid", "low"], default="mid" #}
{# @variable deadline: type=datetime, label="Deadline", placeholder="2026-03-31" #}
{# @variable assigned_to: type=string, label="Assigned To" #}

# {{ project_name }} - Task List

Priority: {{ priority }}
Deadline: {{ deadline }}
Assigned To: {{ assigned_to }}

## Task List
{% for task in tasks %}
- [ ] {{ task }}
{% endfor %}

---
Last updated: {{ deadline }}
```

## API
### Register Template
- **POST** `/api/templates`
- Body: `{"name": "<string:template_name>", "template": "string:template_content"}`

### List Templates
- **GET** `/api/templates`

### Get a Specific Template
- **GET** `/api/templates/<integer:template_id>`

### Render a Specific Template with Data
- **POST** `/api/templates/<integer:template_id>/render`
- Body: `{"string:var_name": "string:value" ...}`

### Delete a Specific Template
- **DELETE** `/api/templates/<integer:template_id>`
