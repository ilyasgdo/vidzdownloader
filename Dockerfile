FROM python:3.11-slim

# Install ffmpeg for yt-dlp audio extraction
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure downloads directory exists
RUN mkdir -p downloads && chmod 777 downloads

# Expose the Flask port
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
