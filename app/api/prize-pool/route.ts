import { NextResponse } from "next/server";
import { ethers } from "ethers";

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getPool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function GET() {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    
    if (!contractAddress) {
      return NextResponse.json(
        { error: "CONTRACT_ADDRESS not configured" },
        { status: 500 }
      );
    }

    if (!usdcAddress) {
      return NextResponse.json(
        { error: "USDC_ADDRESS not configured" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    
    const poolBalance = await contract.getPool(usdcAddress);
    const amount = ethers.formatUnits(poolBalance, 6);
    
    return NextResponse.json({ amount }, { status: 200 });
  } catch (error) {
    console.error("Prize pool error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prize pool", details: String(error) },
      { status: 500 }
    );
  }
}
