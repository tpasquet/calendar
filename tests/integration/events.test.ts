import "dotenv/config";
import { beforeAll, afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";

const getServerSessionMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

const prisma = new PrismaClient();
const eventTitlePrefix = "integration-event-";
let userId: string;

const { GET, POST } = await import("@/app/api/events/route");
const { PATCH, DELETE } = await import("@/app/api/events/[id]/route");

describe("events API integration", () => {
  beforeAll(async () => {
    const user = await prisma.user.findUnique({
      where: { email: "terry@atcalendrier.fr" },
      select: { id: true },
    });

    if (!user) throw new Error("Seed terry@atcalendrier.fr before running integration tests");
    userId = user.id;
  });

  beforeEach(async () => {
    await prisma.event.deleteMany({
      where: { ownerId: userId, title: { startsWith: eventTitlePrefix } },
    });
    getServerSessionMock.mockResolvedValue({ user: { id: userId } });
  });

  afterAll(async () => {
    await prisma.event.deleteMany({
      where: { ownerId: userId, title: { startsWith: eventTitlePrefix } },
    });
    await prisma.$disconnect();
  });

  test("creates, reads, updates, and deletes an event", async () => {
    const startsAt = "2030-01-10T10:00:00.000Z";
    const endsAt = "2030-01-10T11:00:00.000Z";
    const category = await prisma.category.findFirst({ where: { ownerId: userId } });
    const createRequest = new Request("http://localhost/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `${eventTitlePrefix}created`,
        description: "Initial description",
        startsAt,
        endsAt,
        allDay: false,
        categoryId: category?.id,
      }),
    });

    const createResponse = await POST(createRequest);
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()).event;
    expect(created.title).toBe(`${eventTitlePrefix}created`);
    expect(created.ownerId).toBe(userId);

    const listResponse = await GET(
      new Request("http://localhost/api/events?from=2030-01-01T00:00:00.000Z&to=2030-01-31T23:59:59.999Z"),
    );
    expect(listResponse.status).toBe(200);
    const listed = (await listResponse.json()).occurrences;
    expect(listed).toHaveLength(1);
    expect(listed[0].event.id).toBe(created.id);

    const updateResponse = await PATCH(
      new Request(`http://localhost/api/events/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: `${eventTitlePrefix}updated` }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(updateResponse.status).toBe(200);
    expect((await updateResponse.json()).event.title).toBe(`${eventTitlePrefix}updated`);

    const deleteResponse = await DELETE(new Request("http://localhost/api/events"), {
      params: Promise.resolve({ id: created.id }),
    });
    expect(deleteResponse.status).toBe(200);
    expect(await prisma.event.findUnique({ where: { id: created.id } })).toBeNull();
  });

  test("rejects event reads without an authenticated session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/events?from=2030-01-01T00:00:00.000Z&to=2030-01-31T23:59:59.999Z"),
    );

    expect(response.status).toBe(401);
  });

  test("rejects an event with invalid dates", async () => {
    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${eventTitlePrefix}invalid`,
          startsAt: "2030-01-10T11:00:00.000Z",
          endsAt: "2030-01-10T10:00:00.000Z",
          allDay: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("date de fin");
  });
});
