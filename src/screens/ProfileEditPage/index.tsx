import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { FileUpload } from "../../components/ui/file-upload";
import { ProfileFormData, profileSchema } from "../../lib/schema/profile";
import { useAuth } from "../../contexts/AuthContext";
import { uploadImage } from "../../lib/cloudinary";
import { useToast } from "../../components/ui/use-toast";

export function ProfileEditPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      location: "",
      website: "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      
      // アバター画像のアップロード処理
      let avatarUrl = null;
      if (avatarFile) {
        const publicId = await uploadImage(avatarFile);
        // 実際の実装では、生成されたURLを保存する
        console.log("Uploaded image publicId:", publicId);
        avatarUrl = publicId;
      }

      // プロフィールデータの更新処理
      // 実際の実装では、SupabaseやAPIでデータを更新する
      console.log("Form data submitted:", { ...data, avatarUrl });
      
      toast({
        title: "プロフィールを更新しました",
        description: "変更が正常に保存されました。",
      });
      
      // フォームをリセット
      // reset();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの更新に失敗しました。後でもう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="プロフィール編集">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">プロフィール情報</h2>
          
          <div className="mb-6">
            <Label htmlFor="avatar">プロフィール画像</Label>
            <FileUpload
              onChange={setAvatarFile}
              value={avatarFile}
              previewUrl={user?.user_metadata?.avatar_url}
              className="mt-2"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                {...register("displayName")}
                className="mt-1"
                placeholder="あなたの表示名"
                defaultValue={user?.user_metadata?.full_name || ""}
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-gray-500 text-xs mt-1">
                メールアドレスは変更できません
              </p>
            </div>
            
            <div>
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                className="mt-1"
                placeholder="あなた自身について簡単に教えてください"
                rows={4}
              />
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                {...register("location")}
                className="mt-1"
                placeholder="例: 東京都渋谷区"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                {...register("website")}
                className="mt-1"
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
              )}
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
} 