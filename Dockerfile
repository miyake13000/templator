FROM python:3.14-slim

# Copy the requirements file and install dependencies
RUN mkdir -p /app
COPY . /app

# Install Python and pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Set the working directory
WORKDIR /app

# Expose the port the application will run on
EXPOSE 5000

# Set the command to run the application
CMD [ "python", "app.py", "-b", "0.0.0.0", "-p", "5000" ]
