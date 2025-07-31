# Kod dosyalarını tek bir txt dosyasında toplayan PowerShell scripti
param(
    [string]$ProjectPath = ".",
    [string]$OutputFile = "all_code.txt"
)

# Kod dosya uzantıları
$codeExtensions = @("*.js", "*.ts", "*.jsx", "*.tsx", "*.py", "*.java", "*.c", "*.cpp", "*.h", "*.cs", "*.php", "*.rb", "*.go", "*.rs", "*.swift", "*.kt", "*.scala", "*.html", "*.css", "*.scss", "*.less", "*.vue", "*.svelte", "*.sql", "*.xml", "*.json", "*.yaml", "*.yml", "*.md", "*.txt", "*.sh", "*.bat", "*.ps1")

# Hariç tutulacak klasörler
$excludeFolders = @("node_modules", ".git", "dist", "build", "target", "bin", "obj", ".vscode", ".idea", "__pycache__")

Write-Host "Kod dosyaları toplanıyor..." -ForegroundColor Green

# Çıktı dosyasını temizle
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

# Başlık ekle
$header = @"
===============================================
PROJE KOD DOSYALARI
Oluşturulma Tarihi: $(Get-Date)
Proje Yolu: $(Resolve-Path $ProjectPath)
===============================================

"@

Add-Content -Path $OutputFile -Value $header -Encoding UTF8

$fileCount = 0

foreach ($extension in $codeExtensions) {
    $files = Get-ChildItem -Path $ProjectPath -Filter $extension -Recurse | Where-Object {
        $exclude = $false
        foreach ($folder in $excludeFolders) {
            if ($_.FullName -like "*\$folder\*") {
                $exclude = $true
                break
            }
        }
        return !$exclude
    }
    
    foreach ($file in $files) {
        $fileCount++
        $relativePath = Resolve-Path -Relative $file.FullName
        
        $separator = @"

===============================================
DOSYA: $relativePath
===============================================

"@
        
        Add-Content -Path $OutputFile -Value $separator -Encoding UTF8
        
        try {
            $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            Add-Content -Path $OutputFile -Value $content -Encoding UTF8
        }
        catch {
            Add-Content -Path $OutputFile -Value "HATA: Dosya okunamadı - $($_.Exception.Message)" -Encoding UTF8
        }
        
        Write-Host "İşlendi: $relativePath" -ForegroundColor Yellow
    }
}

Write-Host "`nToplam $fileCount dosya işlendi." -ForegroundColor Green
Write-Host "Çıktı dosyası: $OutputFile" -ForegroundColor Cyan