# Read-only source images. Output is outside the Git repository.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repo = 'D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer'
$references = Join-Path $repo 'missions\VISUAL_REDESIGN_DAY_NIGHT_20261027\references'
$electron = Join-Path $repo 'docs\evidence\studio-domain\electron'
$output = 'D:\KNOUX-Workspace\KNOuX_VISUAL_REFERENCE_AUDIT_20261028'
New-Item -ItemType Directory -Path $output -Force | Out-Null
foreach ($theme in @('day','night')) {
    $reference = Join-Path $references ($theme + '\01_organization-studio.png')
    $actualName = if ($theme -eq 'day') { 'library-en-light-1672.png' } else { 'library-en-dark-1672.png' }
    $actualPath = Join-Path $electron $actualName
    if (!(Test-Path -LiteralPath $reference) -or !(Test-Path -LiteralPath $actualPath)) { throw "Missing reference or actual image: $theme" }
    $ref = [System.Drawing.Bitmap]::FromFile($reference)
    $act = [System.Drawing.Bitmap]::FromFile($actualPath)
    try {
        if ($ref.Width -ne $act.Width -or $ref.Height -ne $act.Height) { throw "Dimensions do not match: $theme" }
        $w = $ref.Width; $h = $ref.Height
        $comparison = [System.Drawing.Bitmap]::new($w * 2, $h + 46)
        $canvas = [System.Drawing.Graphics]::FromImage($comparison)
        $font = [System.Drawing.Font]::new('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
        try {
            $canvas.Clear([System.Drawing.Color]::FromArgb(20,19,43))
            $canvas.DrawString("APPROVED $($theme.ToUpper()) REFERENCE", $font, [System.Drawing.Brushes]::White, 16, 6)
            $canvas.DrawString("REAL ELECTRON $($theme.ToUpper()) - VISUAL FAIL", $font, [System.Drawing.Brushes]::White, $w + 16, 6)
            $canvas.DrawImage($ref, 0, 46, $w, $h)
            $canvas.DrawImage($act, $w, 46, $w, $h)
            $comparison.Save((Join-Path $output ("studio-" + $theme + "-reference-vs-electron.png")), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $font.Dispose(); $canvas.Dispose(); $comparison.Dispose() }
        $overlay = [System.Drawing.Bitmap]::new($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($overlay)
        $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
        $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
        try {
            $g.DrawImage($ref, 0, 0, $w, $h)
            $matrix.Matrix33 = 0.5
            $attributes.SetColorMatrix($matrix)
            $g.DrawImage($act, [System.Drawing.Rectangle]::new(0,0,$w,$h), 0,0,$w,$h, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
            $overlay.Save((Join-Path $output ("studio-" + $theme + "-50pct-overlay.png")), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $attributes.Dispose(); $g.Dispose(); $overlay.Dispose() }
        Write-Output "CREATED $theme exact-size comparison and 50pct overlay: $output"
    } finally { $ref.Dispose(); $act.Dispose() }
}
Write-Output 'NO SOURCE IMAGES OR APPLICATION CODE MODIFIED.'
