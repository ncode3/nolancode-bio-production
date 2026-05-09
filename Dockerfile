FROM nginx:stable-alpine

# Copy site files into nginx's default html directory
COPY index.html /usr/share/nginx/html/
COPY images /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]