import { BigNumber } from "ethers";
import { ethers }  from "hardhat";

export const toWei =  (value: number) => {
  return ethers.utils.parseEther(value.toString());
};

export const fromWei = (amount: BigNumber) => {
  return ethers.utils.formatEther(amount)
};

export const fastForwardTheTime = async (valueInSeconds: number) => {
  await ethers.provider.send("evm_increaseTime", [valueInSeconds]);
  await ethers.provider.send("evm_mine", []) ;
};

export const now = async () => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber)
  return block.timestamp
}

export const percent = (percentage:number, amount:string) => {
  return (percentage * Number(amount)) / 100;
};

export const sDuration = {
  seconds: function (val: number) {
    return val;
  },
  minutes: function (val: number) {
    return val * this.seconds(60);
  },
  hours: function (val: number) {
    return val * this.minutes(60);
  },
  days: function (val: number) {
    return val * this.hours(24);
  },
  weeks: function (val: number) {
    return val * this.days(7);
  },
  years: function (val: number) {
    return val * this.days(365);
  },
};


