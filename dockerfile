# Vår builder image

FROM registry.access.redhat.com/ubi9/nodejs-18@sha256:2a1be612f6f2f71fcdbe5b5237ab2b2765b7d37ebbfe1d715e966c7c8002c1b7 as builder

# Lägg till katalogen med din kod
ADD . $HOME
#WORKDIR /opt/app-root/src/

# Installera dependencies
RUN npm install

# Här börjar vi använda vår runtime image

FROM registry.access.redhat.com/ubi9/nodejs-18-minimal@sha256:b52ca946958472a4afb884208222a9dc8af843458d2920f437bc45789448554a

# Kopiera artefakterna som har skapats i builder steget, till runtime
COPY --from=builder $HOME $HOME

# Expose the port on which your application listens
EXPOSE 3001

# Starta node.......................
CMD npm start