sudo yum update -y
sudo yum install autoconf bison gcc gcc-c++ libcurl-devel libxml2-devel -y
curl -sL http://www.openssl.org/source/openssl-1.0.2k.tar.gz | tar -xvz
cd openssl-1.0.2k
./config && make && sudo make install 

cd ~
mkdir -p ~/environment/php-8-bin
curl -sL https://www.php.net/distributions/php-8.3.12.tar.gz | tar -xvz
cd php-8.3.12

./buildconf --force
./configure --prefix=/home/ec2-user/environment/php-8-bin/ --with-openssl=/usr/local/ssl --with-curl --with-zlib --enable-pdo --with-pdo-mysql
make install V=1

cd /home/ec2-user/environment/php-8-bin
ls -la

wget https://raw.githubusercontent.com/aws-samples/php-examples-for-aws-lambda/refs/heads/master/0.1-SimplePhpFunction/bootstrap

chmod +x bootstrap

zip -r runtime.zip bin bootstrap

curl -sS https://getcomposer.org/installer | ./bin/php

./bin/php composer.phar require guzzlehttp/guzzle

zip -r vendor.zip vendor/

aws lambda publish-layer-version     
--layer-name PHP-83-runtime     
--zip-file fileb:///home/ec2-user/environment/php-8-bin/runtime.zip     
--region eu-north-1


aws lambda publish-layer-version --layer-name PHP-83-runtime --zip-file fileb:///home/ec2-user/environment/php-8-bin/runtime.zip --region eu-north-1

aws lambda publish-layer-version --layer-name PHP-83-vendor --zip-file fileb:///home/ec2-user/environment/php-8-bin/vendor.zip --region eu-north-1

aws lambda publish-layer-version \
	--layer-name PHP-83-vendor \
	--zip-file fileb://vendor.zip \
	--region eu-north-1

