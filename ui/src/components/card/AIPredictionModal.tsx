import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoClose, IoDownload } from 'react-icons/io5';
import axios from 'axios';

const AIPredictionGenerator = ({ onCreatePrediction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  const handleGeneratePredictions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://wapo-testnet.phala.network/ipfs/QmSASVvVQT2dw4Dam6Gb7aW3XR2Ch1CYp3Cvx9uySNpdid?url=${encodeURIComponent(url)}&generatePredictions=true`);
      const generatedPredictions = JSON.parse(response.data.predictions[0]).predictions;
      setPredictions(generatedPredictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
    }
    setIsLoading(false);
  };

  const handleSelectPrediction = (prediction) => {
    setSelectedPrediction(prediction);
    setIsModalOpen(true);
  };

  const handleCreatePrediction = () => {
    if (selectedPrediction) {
      onCreatePrediction(selectedPrediction);
      setIsModalOpen(false);
      setSelectedPrediction(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-navy-700 dark:text-white">AI Prediction Generator</h2>
      <div className="flex mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter article URL"
          className="flex-grow p-2 border rounded-l dark:bg-navy-700 dark:text-white dark:border-navy-600"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGeneratePredictions}
          className="bg-brand-500 text-white rounded-r px-4 py-2 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </motion.button>
      </div>

      <AnimatePresence>
        {predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {predictions.map((prediction, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-navy-800 p-4 rounded-lg shadow cursor-pointer"
                onClick={() => handleSelectPrediction(prediction)}
              >
                <h3 className="font-bold text-lg mb-2 text-navy-700 dark:text-white">{prediction.description}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {prediction.duration} seconds</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tags: {prediction.tags.join(', ')}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-lg p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">Create Prediction</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <IoClose size={24} />
                </button>
              </div>
              {selectedPrediction && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={selectedPrediction.description}
                    readOnly
                    className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                  />
                  <input
                    type="number"
                    value={selectedPrediction.duration}
                    readOnly
                    className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                  />
                  <input
                    type="number"
                    value={selectedPrediction.minVotes}
                    readOnly
                    className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                  />
                  <input
                    type="number"
                    value={selectedPrediction.maxVotes}
                    readOnly
                    className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                  />
                  <input
                    type="text"
                    value={selectedPrediction.tags.join(', ')}
                    readOnly
                    className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreatePrediction}
                    className="w-full bg-brand-500 text-white rounded-lg py-2 px-4 hover:bg-brand-600 transition-colors"
                  >
                    Create Prediction
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPredictionGenerator;