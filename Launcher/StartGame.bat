@echo off
:: %~dp0 代表脚本当前所在的文件夹
:: .. 代表上一级目录
:: 这句命令的意思是：进入脚本所在文件夹的上一级（也就是项目根目录）
cd /d "%~dp0.."

title Magic Christmas Tree Console
color 0A

echo ==========================================
echo.
echo       Magic Christmas Tree is Starting...
echo       Designed by UP: zzx
echo.
echo       [Please wait, browser will open automatically...]
echo.
echo ==========================================

:: 此时已经回到了根目录，可以正常运行命令了
call npm run dev

pause