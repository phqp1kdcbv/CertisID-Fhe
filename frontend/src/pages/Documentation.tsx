import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Database, CheckCircle2, GitBranch, Code, Workflow, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Documentation() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-4">Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete guide to understanding and using the CertisID platform
            </p>
          </div>

          {/* Overview */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Project Overview
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  CertisID is a revolutionary blockchain-based identity verification platform that leverages
                  <strong className="text-foreground"> Fully Homomorphic Encryption (FHE)</strong> to enable
                  privacy-preserving Know Your Customer (KYC) processes.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Unlike traditional KYC systems that store sensitive personal information in plaintext,
                  our platform ensures that all identity data remains encrypted at all times - during transmission,
                  storage, and even during verification computations on the blockchain.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Workflow className="w-8 h-8 text-primary" />
              How It Works
            </h2>

            {/* Demo Video */}
            <Card className="mb-8 bg-muted/30">
              <CardContent className="pt-6">
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    poster="/certisid-logo.svg"
                    onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).playbackRate = 2.0; }}
                  >
                    <source src="/test_demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Watch how CertisID platform works - Complete demonstration
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                    Client-Side Encryption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    When you submit your KYC information (name, date of birth, address, nationality, passport number),
                    it is immediately encrypted in your browser using Zama's FHE SDK before any data leaves your device.
                    The encryption uses cryptographic keys that only you control.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                    Blockchain Storage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    The encrypted data is submitted to smart contracts deployed on Ethereum Sepolia testnet.
                    The blockchain stores only the encrypted ciphertext - no one can read your actual information,
                    not even the blockchain validators or contract owners.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
                    Encrypted Computation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Smart contracts can perform verification checks (age validation, nationality checks, policy compliance)
                    directly on the encrypted data using FHE operations. The computation results are also encrypted,
                    maintaining complete privacy throughout the entire process.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">4</div>
                    Zero-Knowledge Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Authorized parties can verify that you meet certain criteria (e.g., age over 18, valid nationality)
                    without ever seeing your actual personal information. The system proves compliance without exposing data.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Technical Architecture */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Code className="w-8 h-8 text-primary" />
              Technical Architecture
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Smart Contracts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>IdentityRegistry:</strong> Stores encrypted identity data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>PolicyEngine:</strong> Defines compliance rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>ReputationScore:</strong> Tracks verification history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>ComplianceVerifier:</strong> Performs encrypted checks</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Frontend Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>React 18 + TypeScript:</strong> Modern UI framework</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>RainbowKit + Wagmi:</strong> Web3 wallet integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Zama FHE SDK 0.2.0:</strong> Client-side encryption</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>ethers.js 6.x:</strong> Blockchain interactions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Key Features */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary" />
              Key Features
            </h2>

            <div className="grid gap-4">
              {[
                {
                  title: "End-to-End Encryption",
                  description: "All data is encrypted before leaving your device and remains encrypted on the blockchain"
                },
                {
                  title: "Privacy-Preserving Verification",
                  description: "Verify credentials without exposing sensitive personal information"
                },
                {
                  title: "Immutable Audit Trail",
                  description: "Every verification event is recorded permanently on the blockchain"
                },
                {
                  title: "Decentralized Trust",
                  description: "No central authority has access to your plaintext data"
                },
                {
                  title: "Regulatory Compliance",
                  description: "Meet KYC requirements while maintaining user privacy"
                },
                {
                  title: "Cryptographic Proofs",
                  description: "Mathematical guarantees of data integrity and authenticity"
                }
              ].map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* Deployment */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-primary" />
              Deployment Information
            </h2>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Network</h3>
                    <p className="text-muted-foreground">Ethereum Sepolia Testnet (Chain ID: 11155111)</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">Smart Contracts</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>IdentityRegistry</span>
                        <span className="text-primary">0x33A3...80Cf</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>PolicyEngine</span>
                        <span className="text-primary">0x20fD...4a69</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>ReputationScore</span>
                        <span className="text-primary">0x5769...7a8c</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>ComplianceVerifier</span>
                        <span className="text-primary">0x022c...0E0a</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-2">FHE Gateway</h3>
                    <p className="text-muted-foreground font-mono text-sm">https://gateway.sepolia.zama.ai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Security Considerations */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Security Considerations</h2>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>This is a <strong className="text-foreground">testnet deployment</strong> for demonstration purposes only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Do not submit real personal information on the testnet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Always verify contract addresses before interacting with mainnet deployments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Keep your wallet seed phrase secure and never share it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Transactions on blockchain are permanent and cannot be reversed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Resources */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Additional Resources</h2>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Zama Documentation</CardTitle>
                  <CardDescription>Learn more about Fully Homomorphic Encryption</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://docs.zama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    docs.zama.ai →
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GitHub Repository</CardTitle>
                  <CardDescription>View source code and contribute</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://github.com/phqp1kdcbv/fhe-kyc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    github.com/phqp1kdcbv/fhe-kyc →
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sepolia Etherscan</CardTitle>
                  <CardDescription>Explore contracts and transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://sepolia.etherscan.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    sepolia.etherscan.io →
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
