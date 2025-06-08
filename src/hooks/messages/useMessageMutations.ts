
import { useSendMessage } from "./mutations/useSendMessage";
import { useEditMessage } from "./mutations/useEditMessage";
import { useClearConversation } from "./mutations/useClearConversation";
import { useDeleteMessage } from "./mutations/useDeleteMessage";

export const useMessageMutations = () => {
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const clearConversation = useClearConversation();
  const deleteMessage = useDeleteMessage();

  return {
    sendMessage,
    editMessage,
    clearConversation,
    deleteMessage
  };
};
