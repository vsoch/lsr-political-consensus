FROM node

RUN apt-get update && apt-get install -y curl vim
RUN curl https://install.meteor.com/ | sh

RUN mkdir /code
ADD . /code
WORKDIR /code/app
RUN meteor update

CMD ["meteor"]
