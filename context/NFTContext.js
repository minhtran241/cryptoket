import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { Buffer } from 'buffer';
import { create as ipfsHttpClient } from 'ipfs-http-client';

import { MarketAddress, MarketAddressABI } from './constants';

const PROJECT_ID = '2Irh9x5yMhXDTqpZGTh7ygsrtPE';
const PROJECT_SECRET = '85de52df8ea4c9092af5ff9af9bec93c';
const PROJECT_DOMAIN = 'https://cryptoket-nft.infura-ipfs.io/ipfs';

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const nftCurrency = 'ETH';

  const checkIsWalletConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log('No accounts found.');
    }
  };

  useEffect(() => {
    checkIsWalletConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    setCurrentAccount(accounts[0]);
    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    try {
      const auth =
        'Basic ' +
        Buffer.from(PROJECT_ID + ':' + PROJECT_SECRET).toString('base64');
      const client = ipfsHttpClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: auth,
        },
      });
      const added = await client.add({ content: file });
      const url = `${PROJECT_DOMAIN}/${added.path}`;
      return url;
    } catch (error) {
      console.log(error);
      alert('Error uploading file to IPFS.');
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    const data = JSON.stringify({ name, description, image: fileUrl });
    try {
      const auth =
        'Basic ' +
        Buffer.from(PROJECT_ID + ':' + PROJECT_SECRET).toString('base64');
      const client = ipfsHttpClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: auth,
        },
      });
      const added = await client.add(data);
      const url = `${PROJECT_DOMAIN}/${added.path}`;
      await createSale(url, price);
      router.push('/');
    } catch (error) {
      console.log(error);
      alert('Error uploading file to IPFS.');
    }
  };

  const createSale = async (url, formInputPrice) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const price = ethers.utils.parseEther(formInputPrice);
    const contract = fetchContract(signer);
    const listingPrice = await contract.listingPrice();

    const transaction = await contract.createToken(url, price, {
      value: listingPrice.toString(),
    });
    await transaction.wait();
  };

  const fetchNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const contract = fetchContract(provider);
    const data = await contract.fetchMarketItems();
    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { name, description, image },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatEther(unformattedPrice);

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          name,
          description,
          image,
          tokenURI,
        };
      })
    );
    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchContract(signer);
    const data =
      type === 'fetchItemsListed'
        ? await contract.fetchItemsListed()
        : await contract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { name, description, image },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatEther(unformattedPrice);

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          name,
          description,
          image,
          tokenURI,
        };
      })
    );
    return items;
  };

  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
