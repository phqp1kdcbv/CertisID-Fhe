import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, Contract } from "ethers";
import { initializeFHE, encryptUint8, encryptUint16, encryptUint32, hashString, calculateAge } from "@/lib/fhe";
import { getCountryCode, getCountryNames } from "@/lib/countries";
import { IDENTITY_REGISTRY_ABI, IDENTITY_REGISTRY_ADDRESS } from "@/contracts/IdentityRegistry";

const kycSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200),
  nationality: z.string().min(2, "Nationality is required"),
  passportNumber: z.string().min(5, "Passport number must be at least 5 characters").max(20),
});

type KYCFormData = z.infer<typeof kycSchema>;

export const KYCForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const countryNames = getCountryNames();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  const selectedNationality = watch("nationality");

  const onSubmit = async (data: KYCFormData) => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = new BrowserProvider(walletClient);
      await initializeFHE(walletClient);

      toast.info("Preparing encrypted data...");

      const fullNameHash = hashString(data.fullName);
      const age = calculateAge(data.dateOfBirth);
      const addressHash = hashString(data.address);
      const countryCode = getCountryCode(data.nationality);
      const passportHash = hashString(data.passportNumber);

      console.log("Data to encrypt:", {
        fullNameHash,
        age,
        addressHash,
        countryCode,
        passportHash,
      });

      toast.info("Encrypting data with FHE...");

      if (!address) {
        throw new Error("Wallet address unavailable");
      }

      const [
        encryptedFullNameHash,
        encryptedAge,
        encryptedAddressHash,
        encryptedCountryCode,
        encryptedPassportHash,
      ] = await Promise.all([
        encryptUint32(fullNameHash, IDENTITY_REGISTRY_ADDRESS, address),
        encryptUint8(age, IDENTITY_REGISTRY_ADDRESS, address),
        encryptUint32(addressHash, IDENTITY_REGISTRY_ADDRESS, address),
        encryptUint16(countryCode, IDENTITY_REGISTRY_ADDRESS, address),
        encryptUint32(passportHash, IDENTITY_REGISTRY_ADDRESS, address),
      ]);

      console.log("Encrypted data prepared");

      toast.info("Submitting to blockchain...");

      const signer = await provider.getSigner();
      const contract = new Contract(IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, signer);

      const tx = await contract.submitIdentity(
        encryptedFullNameHash.handle,
        encryptedFullNameHash.proof,
        encryptedAge.handle,
        encryptedAge.proof,
        encryptedAddressHash.handle,
        encryptedAddressHash.proof,
        encryptedCountryCode.handle,
        encryptedCountryCode.proof,
        encryptedPassportHash.handle,
        encryptedPassportHash.proof
      );

      toast.info("Waiting for transaction confirmation...");
      await tx.wait();

      toast.success("KYC data encrypted and submitted successfully!");
      setIsSubmitted(true);
      reset();

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error: any) {
      console.error("KYC submission error:", error);

      let errorMessage = "Failed to submit KYC data. Please try again.";
      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="kyc-form" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="gradient-cyber bg-clip-text text-transparent">Submit Your KYC</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All information is encrypted using FHE technology before blockchain storage
            </p>
          </div>

          <Card className="shadow-elevated border-border/60 backdrop-blur-sm bg-card/80 rounded-3xl overflow-hidden">
            <CardHeader className="space-y-6 p-8 md:p-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl gradient-cyber shadow-glow flex-shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-3 font-bold">Personal Information</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Your data is encrypted client-side with FHE before submission.
                    <span className="block mt-2 font-semibold text-foreground">
                      Zero-knowledge proofs ensure verifiability without exposing your information.
                    </span>
                  </CardDescription>
                </div>
              </div>

              {!isConnected && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Please connect your wallet to submit KYC information
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-8 md:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="fullName" className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      {...register("fullName")}
                      className="h-12 rounded-xl border-2 transition-smooth focus:border-primary text-base"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="dateOfBirth" className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      className="h-12 rounded-xl border-2 transition-smooth focus:border-primary text-base"
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="nationality" className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Nationality
                    </Label>
                    <Select
                      value={selectedNationality}
                      onValueChange={(value) => setValue("nationality", value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 transition-smooth focus:border-primary text-base">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryNames.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.nationality && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.nationality.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Residential Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, Country"
                      {...register("address")}
                      className="h-12 rounded-xl border-2 transition-smooth focus:border-primary text-base"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="passportNumber" className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Passport Number
                    </Label>
                    <Input
                      id="passportNumber"
                      placeholder="ABC123456"
                      {...register("passportNumber")}
                      className="h-12 rounded-xl border-2 transition-smooth focus:border-primary text-base"
                    />
                    {errors.passportNumber && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.passportNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmitting || !isConnected}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-elevated hover:shadow-glow"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Encrypting & Submitting to Blockchain...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Successfully Submitted
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Encrypt & Submit to Blockchain
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/20">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">End-to-End Encryption</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your data undergoes client-side FHE encryption before transmission.
                        Even on-chain, your information remains completely encrypted and private,
                        accessible only through your cryptographic keys.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
