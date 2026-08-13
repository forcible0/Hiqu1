import { useEffect, useMemo, useState } from "react";
import { AppModals } from "./components/AppModals";
import { AuthScreen } from "./components/AuthScreen";
import { ChatView } from "./components/ChatView";
import { HomeSidebar, ServerSidebarPanel } from "./components/ChannelSidebar";
import { FriendsView } from "./components/FriendsView";
import { MembersSidebar } from "./components/MembersSidebar";
import { MessageRequestsView } from "./components/MessageRequestsView";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { FullProfileModal } from "./components/FullProfileModal";
import { ServerSidebar } from "./components/ServerSidebar";
import { AppProvider, useApp } from "./context/AppContext";
import type { ForwardDestination, User, UserProfileDetails } from "./types";
import * as api from "./api/client";

function AppContent() {
  const app = useApp();
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(true);
  const [messageSearch, setMessageSearch] = useState("");
  const [fullProfileOpen, setFullProfileOpen] = useState(false);
  const [fullProfileData, setFullProfileData] = useState<UserProfileDetails | null>(null);
  const [fullProfileLoading, setFullProfileLoading] = useState(false);

  useEffect(() => {
    setProfileSidebarOpen(true);
    setMessageSearch("");
    setFullProfileOpen(false);
    setFullProfileData(null);
  }, [app.activeDmId]);

  const forwardDestinations = useMemo((): ForwardDestination[] => {
    const dmUsers = [...app.friends, ...app.dmPartners];
    const seen = new Set<string>();
    const dms: ForwardDestination[] = [];
    for (const u of dmUsers) {
      if (u.id === app.currentUser?.id || seen.has(u.id)) continue;
      seen.add(u.id);
      dms.push({ type: "dm", id: u.id, name: u.name, avatar: u.avatar });
    }
    const groups: ForwardDestination[] = app.groupDms.map((g) => ({
      type: "group",
      id: g.id,
      name: g.name,
      avatar: g.icon,
    }));
    const channels: ForwardDestination[] = app.channels.map((c) => ({
      type: "channel",
      id: c.id,
      name: `#${c.name}`,
    }));
    return [...dms, ...groups, ...channels];
  }, [app.friends, app.dmPartners, app.groupDms, app.channels, app.currentUser?.id]);

  const openFullProfile = async (userId: string) => {
    if (!app.token) return;
    setFullProfileOpen(true);
    setFullProfileLoading(true);
    try {
      const data = await api.fetchUserProfile(app.token, userId);
      setFullProfileData(data);
    } catch {
      setFullProfileOpen(false);
    } finally {
      setFullProfileLoading(false);
    }
  };

  if (!app.token || !app.currentUser) {
    return <AuthScreen onLogin={app.login} onRegister={app.register} />;
  }

  if (app.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-hiqu-bg">
        <div className="text-hiqu-muted">Yükleniyor...</div>
      </div>
    );
  }

  const activeServer =
    app.activeServerId !== "home"
      ? app.servers.find((s) => s.id === app.activeServerId)
      : null;
  const activeDmUser = app.activeDmId
    ? app.friends.find((u) => u.id === app.activeDmId) ??
      app.dmPartners.find((u) => u.id === app.activeDmId)
    : null;
  const activeGroup = app.activeGroupDmId
    ? app.groupDms.find((g) => g.id === app.activeGroupDmId)
    : null;
  const activeChannel = app.channels.find((c) => c.id === app.activeChannelId);

  const authorMap: Record<string, User> = {};
  for (const u of [
    ...app.friends,
    ...app.serverMembers,
    ...app.dmPartners,
    ...(activeGroup?.members ?? []),
  ]) {
    authorMap[u.id] = u;
  }
  if (app.currentUser) authorMap[app.currentUser.id] = app.currentUser;

  const openUserSettings = () => app.setActiveModal("settings", "account");
  const openProfileSettings = () => app.setActiveModal("settings", "profile");
  const openServerSettings = () => app.setActiveModal("settings", "server-overview");
  const handleSetStatus = (status: User["status"]) => app.updateProfile({ status });

  return (
    <>
      <div className="hiqu-app-shell flex h-full overflow-hidden">
        <ServerSidebar
          servers={app.servers}
          activeId={app.activeServerId}
          onSelectHome={app.openHome}
          onSelectServer={app.openServer}
          onCreateServer={() => app.setActiveModal("createServer")}
          onJoinServer={() => app.setActiveModal("joinServer")}
        />

        {app.activeServerId === "home" ? (
          <HomeSidebar
            currentUser={app.currentUser}
            friends={app.friends}
            dmPartners={app.dmPartners}
            groupDms={app.groupDms}
            messageRequestCount={app.messageRequests.length}
            activeDmId={app.activeDmId}
            activeGroupDmId={app.activeGroupDmId}
            friendsActive={app.view === "friends"}
            messageRequestsActive={app.view === "message-requests"}
            onFriendsClick={app.openFriends}
            onMessageRequestsClick={app.openMessageRequests}
            onSelectDm={(id) => {
              setMessageSearch("");
              app.openDm(id);
            }}
            onSelectGroupDm={app.openGroupDm}
            onNewDm={() => app.setActiveModal("newDm")}
            onNewGroupDm={() => app.setActiveModal("newGroupDm")}
            onSettings={openUserSettings}
            onEditProfile={openProfileSettings}
            onSetStatus={handleSetStatus}
            onLogout={app.logout}
          />
        ) : activeServer ? (
          <ServerSidebarPanel
            server={activeServer}
            channels={app.channels}
            activeChannelId={app.activeChannelId}
            currentUser={app.currentUser}
            isOwner={activeServer.ownerId === app.currentUser.id}
            onSelectChannel={app.openChannel}
            onCreateChannel={() => app.setActiveModal("createChannel")}
            onServerSettings={openServerSettings}
            onLogout={app.logout}
            onUserSettings={openUserSettings}
            onEditProfile={openProfileSettings}
            onSetStatus={handleSetStatus}
            onLeaveServer={() => app.leaveServer(activeServer.id)}
          />
        ) : null}

        {app.view === "friends" && app.activeServerId === "home" && (
          <FriendsView
            tab={app.friendsTab}
            onTabChange={app.setFriendsTab}
            friends={app.friends}
            pending={app.pending}
            blocked={app.blocked}
            onAddFriend={() => app.setActiveModal("addFriend")}
            onNewGroupDm={() => app.setActiveModal("newGroupDm")}
            onMessage={app.openDm}
            onAccept={app.acceptFriend}
            onDecline={app.declineFriend}
            onCancel={app.cancelFriendRequest}
            onBlock={app.blockUser}
            onUnblock={app.unblockUser}
            onRemove={app.removeFriend}
          />
        )}

        {app.view === "message-requests" && app.activeServerId === "home" && (
          <MessageRequestsView
            requests={app.messageRequests}
            onAccept={app.acceptMessageRequest}
            onDecline={app.declineMessageRequest}
          />
        )}

        {app.view === "dm" && activeDmUser && app.currentUser && (
          <ChatView
            key={`dm-${activeDmUser.id}`}
            chatId={`dm-${activeDmUser.id}`}
            title={activeDmUser.name}
            subtitle={`@${activeDmUser.username}`}
            avatar={activeDmUser.avatar}
            status={activeDmUser.status}
            currentUser={app.currentUser}
            messages={app.dmMessages[activeDmUser.id] ?? []}
            authorMap={authorMap}
            placeholder={`@${activeDmUser.username} kullanıcısına mesaj`}
            onSend={(c, replyToId) => app.sendDm(activeDmUser.id, c, replyToId)}
            emptyMessage={`${activeDmUser.name} ile sohbetin başlangıcı.`}
            searchQuery={messageSearch}
            headerSearchActive={profileSidebarOpen}
            onSearchClick={() => setProfileSidebarOpen(true)}
            showProfileToggle={!profileSidebarOpen}
            onShowProfile={() => setProfileSidebarOpen(true)}
            pinnedIds={app.chatPins[`dm-${activeDmUser.id}`] ?? []}
            onPin={(id) => app.pinMessage(`dm-${activeDmUser.id}`, id)}
            onUnpin={(id) => app.unpinMessage(`dm-${activeDmUser.id}`, id)}
            onReact={(id, emoji) => app.toggleReaction(`dm-${activeDmUser.id}`, id, emoji)}
            forwardDestinations={forwardDestinations}
            onForward={app.forwardMessage}
          />
        )}

        {app.view === "group-dm" && activeGroup && app.currentUser && (
          <ChatView
            key={`group-${activeGroup.id}`}
            chatId={`group-${activeGroup.id}`}
            title={activeGroup.name}
            subtitle={`${activeGroup.members.length} üye`}
            avatar={activeGroup.icon}
            currentUser={app.currentUser}
            messages={app.groupDmMessages[activeGroup.id] ?? []}
            authorMap={authorMap}
            placeholder={`${activeGroup.name} grubuna mesaj`}
            onSend={(c, replyToId) => app.sendGroupDm(activeGroup.id, c, replyToId)}
            emptyMessage={`${activeGroup.name} grubunun başlangıcı.`}
            pinnedIds={app.chatPins[`group-${activeGroup.id}`] ?? []}
            onPin={(id) => app.pinMessage(`group-${activeGroup.id}`, id)}
            onUnpin={(id) => app.unpinMessage(`group-${activeGroup.id}`, id)}
            onReact={(id, emoji) => app.toggleReaction(`group-${activeGroup.id}`, id, emoji)}
            forwardDestinations={forwardDestinations}
            onForward={app.forwardMessage}
          />
        )}

        {app.view === "channel" && activeChannel && app.currentUser && (
          <ChatView
            key={`channel-${activeChannel.id}`}
            chatId={`channel-${activeChannel.id}`}
            title={activeChannel.name}
            currentUser={app.currentUser}
            messages={app.channelMessages[activeChannel.id] ?? []}
            authorMap={authorMap}
            placeholder={`#${activeChannel.name} kanalına mesaj`}
            onSend={(c, replyToId) => app.sendChannelMessage(activeChannel.id, c, replyToId)}
            emptyMessage={`#${activeChannel.name} kanalına hoş geldin!`}
            pinnedIds={app.chatPins[`channel-${activeChannel.id}`] ?? []}
            onPin={(id) => app.pinMessage(`channel-${activeChannel.id}`, id)}
            onUnpin={(id) => app.unpinMessage(`channel-${activeChannel.id}`, id)}
            onReact={(id, emoji) => app.toggleReaction(`channel-${activeChannel.id}`, id, emoji)}
            forwardDestinations={forwardDestinations}
            onForward={app.forwardMessage}
          />
        )}

        {app.view === "friends" && app.activeServerId === "home" && (
          <MembersSidebar members={app.friends.filter((f) => f.status !== "offline")} title="Çevrimiçi" />
        )}

        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
            app.view === "dm" && activeDmUser && profileSidebarOpen ? "w-80" : "w-0"
          }`}
        >
          {app.view === "dm" && activeDmUser && profileSidebarOpen && (
            <ProfileSidebar
              user={activeDmUser}
              searchQuery={messageSearch}
              onSearchChange={setMessageSearch}
              onHide={() => setProfileSidebarOpen(false)}
              onViewFullProfile={() => openFullProfile(activeDmUser.id)}
            />
          )}
        </div>

        {app.view === "channel" && app.activeServerId !== "home" && (
          <MembersSidebar members={app.serverMembers} />
        )}
      </div>
      {fullProfileOpen && activeDmUser && (
        <FullProfileModal
          user={fullProfileData?.user ?? activeDmUser}
          mutualServers={fullProfileData?.mutualServers ?? []}
          mutualFriends={fullProfileData?.mutualFriends ?? []}
          friendsSince={fullProfileData?.friendsSince}
          isFriend={fullProfileData?.isFriend ?? app.friends.some((f) => f.id === activeDmUser.id)}
          loading={fullProfileLoading}
          onClose={() => setFullProfileOpen(false)}
          onMessage={() => app.openDm(activeDmUser.id)}
          onOpenDm={app.openDm}
          onAddFriend={
            fullProfileData && !fullProfileData.isFriend
              ? () => app.sendFriendRequest(activeDmUser.username)
              : undefined
          }
          onOpenServer={app.openServer}
        />
      )}
      <AppModals />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
