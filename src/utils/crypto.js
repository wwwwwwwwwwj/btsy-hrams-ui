import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
import { uuid } from 'ele-admin-plus';

/**
 * 随机生成aes密钥
 */
export const generateAesKey = () => {
  return CryptoJS.enc.Utf8.parse(uuid());
};

/**
 * 加密base64
 */
export const encryptBase64 = (str) => {
  return CryptoJS.enc.Base64.stringify(str);
};

/**
 * 解密base64
 */
export const decryptBase64 = (str) => {
  return CryptoJS.enc.Base64.parse(str);
};

/**
 * 使用密钥对数据进行加密
 * @param message 数据
 * @param aesKey 密钥
 */
export const encryptWithAes = (message, aesKey) => {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};

/**
 * 使用密钥对数据进行解密
 * @param message 数据
 * @param aesKey 密钥
 */
export const decryptWithAes = (message, aesKey) => {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * 加密
 * @param txt 数据
 */
export const encrypt = (txt) => {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(import.meta.env.VITE_APP_RSA_PUBLIC_KEY); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
};

/**
 * 解密
 * @param txt 数据
 */
export const decrypt = (txt) => {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(import.meta.env.VITE_APP_RSA_PRIVATE_KEY); // 设置私钥
  return encryptor.decrypt(txt); // 对数据进行解密
};
