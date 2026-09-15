export const exerciseSolutions = {
 'The copy that wasn’t': `from copy import deepcopy
a = [[1, 2], [3, 4]]
b = a.copy()
b[0].append(5)
assert a == [[1, 2, 5], [3, 4]]
assert a is not b and a[0] is b[0]
isolated = deepcopy(a)
isolated[0].append(6)
assert a[0] == [1, 2, 5]`,
 'Group log events': `from collections import Counter
def count_levels(events):
    return dict(Counter(event["severity"] for event in events))
assert count_levels([]) == {}
assert count_levels([{"severity": "INFO"}, {"severity": "ERROR"}, {"severity": "INFO"}]) == {"INFO": 2, "ERROR": 1}`,
 'Bounded concurrent requests': `import asyncio
async def fetch_one(url, semaphore, client):
    async with semaphore:
        async with asyncio.timeout(10):
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
async def fetch_all(urls, client):
    semaphore = asyncio.Semaphore(5)
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(fetch_one(url, semaphore, client)) for url in urls]
    return [task.result() for task in tasks]
# Caller owns an httpx.AsyncClient context. TaskGroup observes failures and
# cancels siblings; async context managers release permits on cancellation.
# For very large inputs, use a bounded worker queue instead of one task per URL.`,
 'Validate a tool call': `from pydantic import BaseModel, Field, ConfigDict
class CreateSupportNote(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    customer_id: str = Field(min_length=1)
    note: str = Field(min_length=1, max_length=500)
    request_key: str = Field(min_length=1)
def create_support_note(payload, auth, repository):
    args = CreateSupportNote.model_validate(payload)
    if "notes:write" not in auth.scopes:
        raise PermissionError("missing write scope")
    customer = repository.get_customer(auth.tenant_id, args.customer_id)
    if customer is None: raise PermissionError("customer unavailable")
    return repository.insert_note_once(
        tenant_id=auth.tenant_id, request_key=args.request_key,
        customer_id=args.customer_id, note=args.note)
# insert_note_once must atomically enforce (tenant_id, request_key) uniqueness,
# return the existing result on identical retries, and reject changed payloads.
# auth comes from verified server identity, never from model arguments.`
};
