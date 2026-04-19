import React from 'react';

const ShareCardPrompt = ({ card }) => {
    const { name, year, serial, parallel, setName, image } = card;

    return (
        <div className="flex bg-white p-4 rounded-md shadow-lg">
            <img src={image || 'path_to_placeholder_image.jpg'} alt={name} className="w-1/3 h-auto rounded-md" />
            <div className="ml-4 flex flex-col">
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="italic">Year: {year}</p>
                {serial && <p>Serial: {serial}</p>}
                {parallel && <p className="tag">Parallel: {parallel}</p>}
                <p>Set: {setName}</p>
                <select className="mt-2">
                    <option value="">Select Price</option>
                    <option value="5">$5</option>
                    <option value="10">$10</option>
                    <option value="negotiable">Negotiable</option>
                </select>
                <div className="mt-4">
                    <button className="bg-blue-500 text-white rounded-md px-4 py-2 mr-2">Share This Listing</button>
                    <button className="bg-green-500 text-white rounded-md px-4 py-2">Download Image</button>
                </div>
            </div>
        </div>
    );
};

export default ShareCardPrompt;