FROM node

RUN apt-get update && apt-get install -y wget vim
RUN mkdir /code
ADD . /code
WORKDIR /code
RUN chmod u+x /code/install-meteor.sh

# Important: this will install an older (1.1.0.3) version of meteor
RUN bash /code/install-meteor.sh

# DO NOT run meteor update
WORKDIR /code/app

CMD ["meteor","--settings","settings.json"]
