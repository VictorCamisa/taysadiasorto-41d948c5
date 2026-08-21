import { useState } from "react";
import { Bot, Settings, MessageSquare, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { AgentsList } from "@/components/agents/AgentsList";
import { AgentForm } from "@/components/agents/AgentForm";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentDocuments } from "@/components/agents/AgentDocuments";
import {
  useAIAgents,
  useAIAgentDocuments,
  useAIAgentConversations,
  useAIAgentMessages,
  AIAgent,
  AIAgentConversation,
} from "@/hooks/useAIAgents";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const AssistenteIA = () => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [currentConversation, setCurrentConversation] = useState<AIAgentConversation | null>(null);

  const { agents, isLoading, createAgent, updateAgent, deleteAgent, isCreating } = useAIAgents();
  const { documents, addDocument, deleteDocument, reprocessDocument, isAdding, isReprocessing } = useAIAgentDocuments(selectedAgent?.id || null);
  const { conversations, createConversation, deleteConversation } = useAIAgentConversations(selectedAgent?.id || null);
  const { messages, addMessage, isLoading: isLoadingMessages, refetch: refetchMessages } = useAIAgentMessages(currentConversation?.id || null);

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setCurrentConversation(null);
    setActiveTab("chat");
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setIsFormOpen(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleSaveAgent = async (data: any) => {
    if (editingAgent) {
      await updateAgent({ id: editingAgent.id, ...data });
      if (selectedAgent?.id === editingAgent.id) {
        setSelectedAgent({ ...selectedAgent, ...data });
      }
    } else {
      const newAgent = await createAgent(data);
      setSelectedAgent(newAgent);
    }
  };

  const handleDeleteAgent = async () => {
    if (deleteAgentId) {
      await deleteAgent(deleteAgentId);
      if (selectedAgent?.id === deleteAgentId) {
        setSelectedAgent(null);
      }
      setDeleteAgentId(null);
    }
  };

  const handleSelectConversation = (conv: AIAgentConversation) => {
    setCurrentConversation(conv);
  };

  const handleCreateConversation = async () => {
    const newConv = await createConversation("Nova Conversa");
    setCurrentConversation(newConv);
    return newConv;
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedAgent || !currentConversation) return;
    
    // Add user message
    await addMessage({
      role: "user",
      content,
      agent_id: selectedAgent.id,
    });

    // Refetch to get the assistant response saved by the edge function
    setTimeout(() => refetchMessages(), 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="Agentes de IA"
        description="Crie e gerencie seus agentes de inteligência artificial"
      />

      <div className="flex-1 flex gap-6 min-h-0 mt-6">
        {/* Left sidebar - Agents list */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full">
            <CardContent className="p-4 h-full overflow-auto">
              <AgentsList
                agents={agents}
                selectedAgentId={selectedAgent?.id || null}
                onSelectAgent={handleSelectAgent}
                onCreateAgent={handleCreateAgent}
                onEditAgent={handleEditAgent}
                onDeleteAgent={(id) => setDeleteAgentId(id)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {selectedAgent ? (
            <Card className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedAgent.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedAgent.model}</p>
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Config
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 min-h-0">
                {activeTab === "chat" && (
                  <AgentChat
                    agent={selectedAgent}
                    conversations={conversations}
                    currentConversation={currentConversation}
                    messages={messages}
                    onSelectConversation={handleSelectConversation}
                    onCreateConversation={handleCreateConversation}
                    onDeleteConversation={deleteConversation}
                    onSendMessage={handleSendMessage}
                    isLoadingMessages={isLoadingMessages}
                  />
                )}
                {activeTab === "documents" && (
                  <div className="p-6 overflow-auto h-full">
                    <AgentDocuments
                      documents={documents}
                      onAddDocument={addDocument}
                      onDeleteDocument={deleteDocument}
                      onReprocessDocument={reprocessDocument}
                      isLoading={false}
                      isAdding={isAdding}
                      isReprocessing={isReprocessing}
                    />
                  </div>
                )}
                {activeTab === "settings" && (
                  <div className="p-6 overflow-auto h-full">
                    <AgentForm
                      agent={selectedAgent}
                      isOpen={true}
                      onClose={() => setActiveTab("chat")}
                      onSave={async (data) => {
                        await handleSaveAgent(data);
                        setActiveTab("chat");
                      }}
                      isSaving={false}
                    />
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Plataforma de Agentes IA</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Crie agentes de IA personalizados com memória, RAG e conexão com banco de dados
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateAgent}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Bot className="h-4 w-4" />
                    Criar Primeiro Agente
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Agent Form Modal */}
      <AgentForm
        agent={editingAgent}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        isSaving={isCreating}
      />

      <ConfirmDialog
        open={!!deleteAgentId}
        onOpenChange={() => setDeleteAgentId(null)}
        title="Excluir Agente?"
        description="Esta ação não pode ser desfeita. Todas as conversas e documentos do agente serão removidos."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDeleteAgent}
      />
    </div>
  );
};

export default AssistenteIA;