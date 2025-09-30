Write-Host "🚀 Starting AgriAssist Application" -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Step 1: Check Python and Node.js
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Step 2: Check if inference server is running
Write-Host "`n🔍 Checking inference server status..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "✅ Inference server is already running on port 8000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Inference server is not running" -ForegroundColor Yellow
    
    # Try to start the inference server
    Write-Host "📦 Starting inference server..." -ForegroundColor Yellow
    
    # Navigate to inference server directory
    $inferenceServerPath = "E:\Project\Hackathon\AgriAssist3\AgriAssist\ml"
    
    if (Test-Path $inferenceServerPath) {
        Set-Location $inferenceServerPath
        
        # Activate virtual environment if it exists
        if (Test-Path ".\venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
        } elseif (Test-Path ".\.venv\Scripts\Activate.ps1") {
            & .\.venv\Scripts\Activate.ps1
        }
        
        # Install required Python packages if requirements.txt exists
        if (Test-Path "requirements.txt") {
            Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
            pip install -r requirements.txt
        }
        
        # Start the server in a new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "python start_server.py" -WorkingDirectory $inferenceServerPath
        
        Write-Host "⏳ Waiting for inference server to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Check again
        if (Test-Port 8000) {
            Write-Host "✅ Inference server started successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Inference server may not have started properly" -ForegroundColor Yellow
            Write-Host "   Please check the inference server window for errors" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Inference server directory not found at: $inferenceServerPath" -ForegroundColor Red
        Write-Host "   Please update the path in this script" -ForegroundColor Yellow
    }
}

# Step 3: Return to main project directory
Set-Location "E:\Project\Hackathon\AgriAssist3\AgriAssist"

# Step 4: Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Step 5: Check environment variables
Write-Host "`n🔐 Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ Environment file found" -ForegroundColor Green
    
    # Check if NEXT_PUBLIC_USE_INFERENCE_SERVER is set to false
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_USE_INFERENCE_SERVER=false") {
        Write-Host "⚠️  Warning: NEXT_PUBLIC_USE_INFERENCE_SERVER is set to false" -ForegroundColor Yellow
        Write-Host "   The app will use Gemini API fallback instead of inference server" -ForegroundColor Yellow
        
        $response = Read-Host "Do you want to enable the inference server? (y/n)"
        if ($response -eq 'y') {
            $envContent = $envContent -replace "NEXT_PUBLIC_USE_INFERENCE_SERVER=false", "NEXT_PUBLIC_USE_INFERENCE_SERVER=true"
            Set-Content ".env.local" -Value $envContent
            Write-Host "✅ Inference server enabled in environment" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️  No .env.local file found" -ForegroundColor Yellow
    Write-Host "   Creating default environment file..." -ForegroundColor Yellow
    
    @"
# Inference Server Configuration
INFER_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_USE_INFERENCE_SERVER=true

# Add your API keys here
GEMINI_API_KEY=your_gemini_api_key_here
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
    Write-Host "   Please add your API keys to .env.local" -ForegroundColor Yellow
}

# Step 6: Start the Next.js application
Write-Host "`n🚀 Starting Next.js application..." -ForegroundColor Green
Write-Host "   Access the app at: http://localhost:9002" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow

npm run dev