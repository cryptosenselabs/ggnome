const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'assets', 'crypto', 'logos');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const coins = {
  'bitcoin.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'ethereum.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'solana.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'dogecoin.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/dogecoin/info/logo.png',
  'pepe.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
  'bonk.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
  'wif.png': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/EKpQGSJtjMFqKZ9KQanUKKcPiUhUhHG3D2Rz4FzQYFjZ/logo.png'
};

Object.entries(coins).forEach(([filename, url]) => {
  const filePath = path.join(dir, filename);
  const file = fs.createWriteStream(filePath);
  
  https.get(url, function(response) {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
      });
    } else {
      console.error(`Failed to download ${filename}: Status Code ${response.statusCode}`);
      file.close();
      fs.unlink(filePath, () => {}); // delete empty file
    }
  }).on('error', function(err) {
    console.error(`Error downloading ${filename}: ${err.message}`);
    fs.unlink(filePath, () => {});
  });
});
