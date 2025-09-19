# ==============================
# PostgreSQL Database Setup Script
# ==============================

Write-Host "==============================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Function to check if psql is available
function Test-PostgreSQL {
    try {
        $null = Get-Command psql -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check if PostgreSQL is installed and accessible
if (-not (Test-PostgreSQL)) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and added to your PATH." -ForegroundColor Yellow
    Write-Host "You can download PostgreSQL from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "PostgreSQL found. Proceeding with database setup..." -ForegroundColor Green
Write-Host ""

# ==============================
# Setup Heatmap Database
# ==============================
Write-Host "1. Setting up Heatmap Database (heatmap_db)..." -ForegroundColor Yellow
Write-Host "   Running: psql -U postgres -f backend\heatmap\database\aa.sql" -ForegroundColor Gray

try {
    $heatmapPath = ".\backend\heatmap\database\aa.sql"
    
    if (Test-Path $heatmapPath) {
        psql -U postgres -f $heatmapPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Heatmap database setup completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Error setting up heatmap database (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ File not found: $heatmapPath" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error setting up heatmap database: $_" -ForegroundColor Red
}

Write-Host ""

# ==============================
# Setup Organizer Dashboard Database
# ==============================
Write-Host "2. Setting up Organizer Dashboard Database (organizer_dashboard)..." -ForegroundColor Yellow

# Step 1: Create schema
Write-Host "   Step 1: Creating database schema..." -ForegroundColor Gray
Write-Host "   Running: psql -U postgres -f backend\Organizer_Dashboard-main\backend\db\script.sql" -ForegroundColor Gray

try {
    $schemaPath = ".\backend\Organizer_Dashboard-main\backend\db\script.sql"
    
    if (Test-Path $schemaPath) {
        psql -U postgres -f $schemaPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Database schema created successfully!" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Error creating database schema (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ File not found: $schemaPath" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error creating database schema: $_" -ForegroundColor Red
}

# Step 2: Insert sample data
Write-Host "   Step 2: Inserting sample data..." -ForegroundColor Gray
Write-Host "   Running: psql -U postgres -f backend\Organizer_Dashboard-main\backend\db\insertData.sql" -ForegroundColor Gray

try {
    $dataPath = ".\backend\Organizer_Dashboard-main\backend\db\insertData.sql"
    
    if (Test-Path $dataPath) {
        psql -U postgres -f $dataPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Sample data inserted successfully!" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Error inserting sample data (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ File not found: $dataPath" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error inserting sample data: $_" -ForegroundColor Red
}

Write-Host ""

# ==============================
# Summary
# ==============================
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Database Setup Summary" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

Write-Host "Databases created:" -ForegroundColor White
Write-Host "• heatmap_db - Campus heatmap and location data" -ForegroundColor Gray
Write-Host "• organizer_dashboard - Event management and organizer data" -ForegroundColor Gray

Write-Host ""
Write-Host "You can now connect to these databases using:" -ForegroundColor Yellow
Write-Host "psql -U postgres -d heatmap_db" -ForegroundColor Gray
Write-Host "psql -U postgres -d organizer_dashboard" -ForegroundColor Gray

Write-Host ""
Write-Host "Database setup completed!" -ForegroundColor Green
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")