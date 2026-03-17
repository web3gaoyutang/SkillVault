import React from 'react';
import { Steps, Form, Input, Select, Button, Upload, Card, Space, Typography, message, Result } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationAPI } from '../../api/organization';
import { skillAPI } from '../../api/skill';
import { versionAPI } from '../../api/version';
import PageHeader from '../../components/PageHeader';

const { Text } = Typography;
const { Dragger } = Upload;

const SkillUpload: React.FC = () => {
  const navigate = useNavigate();
  const { org: existingOrg, name: existingName } = useParams<{ org?: string; name?: string }>();
  const isNewVersion = !!existingOrg && !!existingName;
  const [step, setStep] = React.useState(0);
  const [metadataForm] = Form.useForm();
  const [versionForm] = Form.useForm();
  const [file, setFile] = React.useState<File | null>(null);
  const [createdSkill, setCreatedSkill] = React.useState<{ org: string; name: string } | null>(
    isNewVersion ? { org: existingOrg!, name: existingName! } : null
  );

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationAPI.list(),
  });

  const createSkill = useMutation({
    mutationFn: (values: { org_name: string; name: string; display_name: string; description: string; visibility: string; tags: string[]; runtimes: string[] }) =>
      skillAPI.create(values),
    onSuccess: (_, variables) => {
      setCreatedSkill({ org: variables.org_name, name: variables.name });
      setStep(1);
    },
    onError: (e: Error) => message.error(e.message),
  });

  const uploadVersion = useMutation({
    mutationFn: (values: { version: string; changelog: string }) => {
      if (!createdSkill || !file) throw new Error('Missing data');
      const formData = new FormData();
      formData.append('artifact', file);
      formData.append('version', values.version);
      formData.append('changelog', values.changelog);
      return versionAPI.upload(createdSkill.org, createdSkill.name, formData);
    },
    onSuccess: () => {
      setStep(2);
    },
    onError: (e: Error) => message.error(e.message),
  });

  const steps = isNewVersion
    ? [
        { title: 'Upload', description: 'Upload artifact' },
        { title: 'Done', description: 'Version created' },
      ]
    : [
        { title: 'Metadata', description: 'Skill info' },
        { title: 'Upload', description: 'Upload artifact' },
        { title: 'Done', description: 'Skill created' },
      ];

  const currentStep = isNewVersion ? step : step;

  return (
    <div>
      <PageHeader
        title={isNewVersion ? `Upload New Version` : 'Upload Skill'}
        breadcrumbs={isNewVersion
          ? [{ label: 'Catalog', path: '/' }, { label: `${existingOrg}/${existingName}`, path: `/skills/${existingOrg}/${existingName}` }, { label: 'New Version' }]
          : [{ label: 'Catalog', path: '/' }, { label: 'Upload Skill' }]
        }
      />

      <Card style={{ borderRadius: 12, maxWidth: 700, margin: '0 auto' }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        {/* Step 0: Metadata (skip if new version) */}
        {!isNewVersion && step === 0 && (
          <Form form={metadataForm} layout="vertical" onFinish={(v) => createSkill.mutate(v)}>
            <Form.Item name="org_name" label="Organization" rules={[{ required: true }]}>
              <Select placeholder="Select organization" options={orgs?.map(o => ({ label: o.display_name || o.name, value: o.name })) || []} />
            </Form.Item>
            <Form.Item name="name" label="Skill Name" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase, numbers, hyphens' }]}>
              <Input placeholder="my-skill" />
            </Form.Item>
            <Form.Item name="display_name" label="Display Name">
              <Input placeholder="My Skill" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="What does this skill do?" />
            </Form.Item>
            <Form.Item name="visibility" label="Visibility" initialValue="private">
              <Select options={[
                { label: 'Private', value: 'private' },
                { label: 'Internal', value: 'internal' },
                { label: 'Public', value: 'public' },
              ]} />
            </Form.Item>
            <Form.Item name="runtimes" label="Runtimes">
              <Select mode="multiple" placeholder="Select runtimes" options={[
                { label: 'OpenClaw', value: 'openclaw' },
                { label: 'Claude', value: 'claude' },
              ]} />
            </Form.Item>
            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder="Add tags" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createSkill.isPending} style={{ width: '100%' }}>
              Next: Upload Artifact
            </Button>
          </Form>
        )}

        {/* Step 1: Upload */}
        {((isNewVersion && step === 0) || (!isNewVersion && step === 1)) && (
          <Form form={versionForm} layout="vertical" onFinish={(v) => uploadVersion.mutate(v)}>
            <Form.Item name="version" label="Version" rules={[{ required: true, message: 'Enter semver version' }]}>
              <Input placeholder="1.0.0" />
            </Form.Item>
            <Form.Item name="changelog" label="Changelog">
              <Input.TextArea rows={3} placeholder="What's new in this version?" />
            </Form.Item>
            <Form.Item label="Artifact File" required>
              <Dragger
                beforeUpload={(f) => { setFile(f); return false; }}
                maxCount={1}
                accept=".tar.gz,.tgz,.zip"
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p>Click or drag file to upload</p>
                <p className="ant-upload-hint">.tar.gz, .tgz, or .zip (max 50MB)</p>
              </Dragger>
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploadVersion.isPending}
              disabled={!file}
              style={{ width: '100%' }}
            >
              Upload & Create Version
            </Button>
          </Form>
        )}

        {/* Done */}
        {((isNewVersion && step === 1) || (!isNewVersion && step === 2)) && (
          <Result
            status="success"
            title={isNewVersion ? 'Version uploaded successfully!' : 'Skill created successfully!'}
            subTitle="Your artifact has been uploaded and a security scan has been queued."
            extra={[
              <Button type="primary" key="view" onClick={() => navigate(`/skills/${createdSkill?.org}/${createdSkill?.name}`)}>
                View Skill
              </Button>,
              <Button key="catalog" onClick={() => navigate('/')}>
                Back to Catalog
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default SkillUpload;
