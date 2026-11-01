import { useNavigate } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { MissingPage } from "@/components/shared/MissingPage";
import routes from "../../../routes";

export const ItemMissing = () => {
  const navigate = useNavigate();
  return (
    <MissingPage
      icon={Clapperboard}
      title="This item is not in the production"
      message="It may have been removed from its scene, or its manuscript, passage or file was deleted."
      actionLabel="Back to the Studio"
      onAction={() => navigate(routes.studio())}
    />
  );
};
