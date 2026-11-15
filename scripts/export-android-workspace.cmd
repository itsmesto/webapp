@echo off
setlocal
echo Close itsme invoicey before exporting your Android transfer file.
echo.
set "INVOICEY_EXPORT_RUNTIME="
if exist "%LOCALAPPDATA%\Programs\itsme invoicey\itsme-invoicey.exe" set "INVOICEY_EXPORT_RUNTIME=%LOCALAPPDATA%\Programs\itsme invoicey\itsme-invoicey.exe"
if not defined INVOICEY_EXPORT_RUNTIME if exist "%ProgramFiles%\itsme invoicey\itsme-invoicey.exe" set "INVOICEY_EXPORT_RUNTIME=%ProgramFiles%\itsme invoicey\itsme-invoicey.exe"
if not defined INVOICEY_EXPORT_RUNTIME if exist "%~dp0..\out\installer\win-unpacked\itsme-invoicey.exe" set "INVOICEY_EXPORT_RUNTIME=%~dp0..\out\installer\win-unpacked\itsme-invoicey.exe"
if not defined INVOICEY_EXPORT_RUNTIME set /p "INVOICEY_EXPORT_RUNTIME=Enter the full path to the installed itsme-invoicey.exe: "
if not exist "%INVOICEY_EXPORT_RUNTIME%" (
  echo The software executable could not be found.
  exit /b 1
)
set "ELECTRON_RUN_AS_NODE=1"
if "%~1"=="" (
  "%INVOICEY_EXPORT_RUNTIME%" "%~dp0export-android-workspace.mjs" --output "%USERPROFILE%\Desktop\itsme-invoicey-Android-transfer.invoicey.zip"
) else (
  "%INVOICEY_EXPORT_RUNTIME%" "%~dp0export-android-workspace.mjs" %*
)
set "INVOICEY_EXPORT_RESULT=%ERRORLEVEL%"
if not "%INVOICEY_EXPORT_RESULT%"=="0" echo Export failed. Read the message above, then choose a new output filename if a file already exists.
exit /b %INVOICEY_EXPORT_RESULT%

