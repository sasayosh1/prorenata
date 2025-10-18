import requests
import json

class SanityClient:
    def __init__(self, project_id, dataset, token, api_version):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.api_version = api_version
        self.base_url = f"https://{project_id}.api.sanity.io/{api_version}/data/mutate/{dataset}"

    def patch(self, doc_id):
        return SanityPatchBuilder(self, doc_id)

class SanityPatchBuilder:
    def __init__(self, client, doc_id):
        self.client = client
        self.doc_id = doc_id
        self.operations = {}

    def set(self, **kwargs):
        self.operations['set'] = kwargs
        return self

    def commit(self):
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.client.token}'
        }
        mutations = [{
            'patch': {
                'id': self.doc_id,
                **self.operations
            }
        }]
        payload = {'mutations': mutations}
        
        # print(f"\n--- Sanity API Request Details ---")
        # print(f"URL: {self.client.base_url}")
        # print(f"Headers: {headers}")
        # print(f"Payload: {json.dumps(payload, indent=2)}")
        # print(f"----------------------------------")

        response = requests.post(self.client.base_url, headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors
        return response.json()
