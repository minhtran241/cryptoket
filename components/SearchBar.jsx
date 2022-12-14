import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import images from '../assets';

const SearchBar = () => {
  const [search, setSearch] = useState('');
  const { theme } = useTheme();

  return (
    <>
      <div className="flex-1 flexCenter dark:bg-nft-black-2 bg-white border dark:border-nft-black-2 border-nft-gray-2 px-4 rounded-md">
        <Image
          src={images.search}
          objectFit="contain"
          width={20}
          height={20}
          alt="search"
          className={theme === 'light' && 'filter invert'}
        />
        <input type="text" placeholder="Search for NFT..." className="dark:bg-nft-black-2 bg-white mx-4 w-full dark:text-white text-nft-black-1 font-normal text-xs outline-none" onChange={() => {}} value="" />
      </div>
    </>
  );
};

export default SearchBar;
