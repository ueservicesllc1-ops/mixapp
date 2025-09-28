@echo off
cd /d "C:\Users\ArtDesing\mixercurse-app\MixerCurseApp"
echo Agregando archivos al staging...
git add .
echo Haciendo commit...
git commit -m "feat: Implement setlist activation and New Songs modal improvements

- Add setlist activation functionality with automatic song loading
- Redesign New Songs modal with two-panel layout (B2 songs + setlist selection)
- Increase modal size to 98% width and 95% height for better UX
- Add empty setlist state with add songs button
- Implement currentSetlistSongs state and loadCurrentSetlistSongs function
- Add comprehensive styling for setlist components
- Close modal automatically when setlist is selected
- Add confirmation alerts for setlist activation
- Improve setlist UI with song details (title, artist, BPM, key)
- Add play and remove buttons for setlist songs"
echo Haciendo push...
git push origin master
echo ¡Commit y push completados!
pause
