# Anime quiz (SberApp)
This is the app, which was made as a project of the "client-server applications" 
# Deployment

### Frontend
- Build source files
> $ noderunner@app/ npm run build
- Serve folder
> ~app/public
- Access /index.html

### Backend
- Build source files
> $ noderunner@src/ npm run build
- Serve with node
> node dist/index.js
- Use router(i.e. Nginx or Apache) to reroute backend requests to **localhost:8000**
